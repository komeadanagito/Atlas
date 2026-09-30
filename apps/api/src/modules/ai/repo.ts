import type pg from "pg";
import { conversationTitle, historyTurns, previewOf, type AiChatRequest, type AiConversation, type AiConversationSummary, type AiMessage, type ChatTurn } from "@atlas/shared";
import { query, transaction } from "../../db/client";

/** A reply still "streaming" after this long lost its server (crash/redeploy) and is treated as interrupted. */
const STALE = "10 minutes";
export const INTERRUPTED = "回答已中断";

type SummaryRow = { id: string; title: string; updated_at: Date; preview: string | null };
type MessageRow = { id: string; role: AiMessage["role"]; content: string; reasoning: string | null; status: AiMessage["status"]; error: string | null; stale: boolean };

const toSummary = (row: SummaryRow): AiConversationSummary =>
  ({ id: row.id, title: row.title, updatedAt: row.updated_at.toISOString(), preview: previewOf(row.preview ?? "") });

// Latest non-empty message per conversation; LATERAL + the (conversation_id, seq) index keeps it one index probe per row.
const SUMMARY_SQL = `SELECT c.id, c.title, c.updated_at, last.content AS preview FROM ai_conversations c
  LEFT JOIN LATERAL (SELECT left(content, 200) AS content FROM ai_messages m WHERE m.conversation_id = c.id AND m.content <> '' ORDER BY seq DESC LIMIT 1) last ON true`;

const toMessage = (row: MessageRow): AiMessage => {
  const status = row.status === "streaming" && row.stale ? "error" : row.status;
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    status,
    ...(row.reasoning ? { reasoning: row.reasoning } : {}),
    ...(status === "error" ? { error: row.error ?? INTERRUPTED } : {}),
  };
};

const MESSAGES_SQL = `SELECT id, role, content, reasoning, status, error, (status = 'streaming' AND updated_at <= now() - $2::interval) AS stale
  FROM ai_messages WHERE conversation_id = $1 ORDER BY seq`;

export const listConversations = async (userId: string) => {
  const { rows } = await query<SummaryRow>(`${SUMMARY_SQL} WHERE c.user_id = $1 ORDER BY c.updated_at DESC LIMIT 200`, [userId]);
  return rows.map(toSummary);
};

export const getConversation = async (userId: string, id: string): Promise<AiConversation | null> => {
  const { rows } = await query<SummaryRow>(`${SUMMARY_SQL} WHERE c.id = $1 AND c.user_id = $2`, [id, userId]);
  if (!rows[0]) return null;
  const messages = await query<MessageRow>(MESSAGES_SQL, [id, STALE]);
  return { ...toSummary(rows[0]), messages: messages.rows.map(toMessage) };
};

export const deleteConversation = async (userId: string, id: string) => {
  const { rowCount } = await query("DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2", [id, userId]);
  return !!rowCount;
};

class DuplicateMessageError extends Error {}

export type BeginResult = { ok: true; turns: ChatTurn[] } | { ok: false; reason: "not_found" | "conflict" };

const lockOwned = async (client: pg.PoolClient, userId: string, id: string) =>
  (await client.query("SELECT 1 FROM ai_conversations WHERE id = $1 AND user_id = $2 FOR UPDATE", [id, userId])).rowCount === 1;

const loadMessages = async (client: pg.PoolClient, id: string) =>
  (await client.query<MessageRow>(MESSAGES_SQL, [id, STALE])).rows.map(toMessage);

/**
 * Records the user turn plus a pending reply and returns the upstream history.
 * The row lock serialises concurrent sends so each conversation has at most one live reply.
 */
export const beginChat = (userId: string, request: AiChatRequest): Promise<BeginResult> =>
  transaction<BeginResult>(async (client) => {
    if (request.kind === "ask") {
      await client.query("INSERT INTO ai_conversations(id, user_id, title) VALUES($1, $2, $3) ON CONFLICT (id) DO NOTHING", [request.conversationId, userId, conversationTitle(request.content)]);
    }
    // Also rejects ids owned by another user without revealing that they exist.
    if (!await lockOwned(client, userId, request.conversationId)) return { ok: false, reason: "not_found" };
    const messages = await loadMessages(client, request.conversationId);
    if (messages.some((m) => m.status === "streaming")) return { ok: false, reason: "conflict" };

    if (request.kind === "retry") {
      const last = messages.at(-1);
      if (last?.id !== request.replyId || last.role !== "assistant") return { ok: false, reason: "conflict" };
      await client.query("UPDATE ai_messages SET content = '', reasoning = NULL, error = NULL, status = 'streaming', updated_at = now() WHERE id = $1", [request.replyId]);
      await client.query("UPDATE ai_conversations SET updated_at = now() WHERE id = $1", [request.conversationId]);
      return { ok: true, turns: historyTurns(messages.slice(0, -1)) };
    }

    const inserted = await client.query(
      `INSERT INTO ai_messages(id, conversation_id, role, content, status) VALUES ($1, $3, 'user', $4, 'done'), ($2, $3, 'assistant', '', 'streaming')
       ON CONFLICT (id) DO NOTHING`,
      [request.userMessageId, request.replyId, request.conversationId, request.content],
    );
    // A reused message id means a replayed or forged request; roll back rather than half-insert.
    if (inserted.rowCount !== 2) throw new DuplicateMessageError();
    await client.query("UPDATE ai_conversations SET updated_at = now() WHERE id = $1", [request.conversationId]);
    return { ok: true, turns: historyTurns([...messages, { role: "user", content: request.content, status: "done" }]) };
  }).catch((error): BeginResult => {
    if (error instanceof DuplicateMessageError) return { ok: false, reason: "conflict" };
    throw error;
  });

export type ReplyOutcome = { content: string; reasoning: string; status: "done" | "error"; error?: string };

export const finishReply = (replyId: string, outcome: ReplyOutcome) =>
  transaction(async (client) => {
    const { rows } = await client.query<{ conversation_id: string }>(
      `UPDATE ai_messages SET content = $2, reasoning = NULLIF($3, ''), status = $4, error = $5, updated_at = now()
       WHERE id = $1 AND status = 'streaming' RETURNING conversation_id`,
      [replyId, outcome.content, outcome.reasoning, outcome.status, outcome.error ?? null],
    );
    if (rows[0]) await client.query("UPDATE ai_conversations SET updated_at = now() WHERE id = $1", [rows[0].conversation_id]);
  });