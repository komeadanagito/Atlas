import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { AI_LIMITS, type AiChatRequest, type AiStreamEvent } from "@atlas/shared";
import { requireAuth, type AuthVariables } from "../auth/middleware";
import { aiStatus, ProviderError, streamChat } from "./provider";
import { beginChat, deleteConversation, finishReply, getConversation, INTERRUPTED, listConversations, type ReplyOutcome } from "./repo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export const parseChatRequest = (value: unknown): AiChatRequest | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (!isId(body.conversationId) || !isId(body.replyId)) return null;
  if (body.kind === "retry") return { kind: "retry", conversationId: body.conversationId, replyId: body.replyId };
  if (body.kind !== "ask" || !isId(body.userMessageId) || body.userMessageId === body.replyId) return null;
  if (typeof body.content !== "string") return null;
  const content = body.content.trim();
  if (!content || content.length > AI_LIMITS.maxTurnChars) return null;
  return { kind: "ask", conversationId: body.conversationId, userMessageId: body.userMessageId, replyId: body.replyId, content };
};

/** Fixed-window per-key budget; in-process only, like the auth limiter. */
export const createBudget = (limit: number, windowMs: number, now = () => Date.now()) => {
  const windows = new Map<string, { start: number; count: number }>();
  return (key: string) => {
    const at = now();
    const current = windows.get(key);
    const window = current && at - current.start < windowMs ? current : { start: at, count: 0 };
    window.count++;
    windows.set(key, window);
    return window.count <= limit;
  };
};

const allow = createBudget(20, 60_000);

export const aiRoutes = new Hono<{ Variables: AuthVariables }>();
aiRoutes.use("*", requireAuth);

aiRoutes.get("/status", (c) => c.json(aiStatus()));

aiRoutes.get("/conversations", async (c) => c.json(await listConversations(c.get("userId"))));

aiRoutes.get("/conversations/:id", async (c) => {
  const id = c.req.param("id");
  const conversation = isId(id) ? await getConversation(c.get("userId"), id) : null;
  return conversation ? c.json(conversation) : c.json({ error: "对话不存在" }, 404);
});

aiRoutes.delete("/conversations/:id", async (c) => {
  const id = c.req.param("id");
  if (!isId(id) || !await deleteConversation(c.get("userId"), id)) return c.json({ error: "对话不存在" }, 404);
  return c.json({ ok: true });
});

aiRoutes.post("/chat", async (c) => {
  const request = parseChatRequest(await c.req.json<unknown>().catch(() => null));
  if (!request) return c.json({ error: "消息格式无效或内容过长" }, 400);
  if (!aiStatus().configured) return c.json({ error: "AI 服务尚未配置" }, 503);
  const userId = c.get("userId");
  if (!allow(userId)) { c.header("Retry-After", "60"); return c.json({ error: "提问过于频繁，请稍后再试" }, 429); }

  const begun = await beginChat(userId, request);
  if (!begun.ok) {
    return begun.reason === "not_found"
      ? c.json({ error: "对话不存在" }, 404)
      : c.json({ error: "上一条回答尚未完成，请稍候" }, 409);
  }

  // The reply row is now "streaming"; every exit path below must settle it exactly once.
  const reply = { content: "", reasoning: "" };
  let settled = false;
  const settle = async (outcome: Omit<ReplyOutcome, "content" | "reasoning">) => {
    if (settled) return;
    settled = true;
    await finishReply(request.replyId, { ...reply, ...outcome }).catch((error) => console.error("AI reply persist failed", error));
  };

  const upstream = new AbortController();
  c.req.raw.signal.addEventListener("abort", () => upstream.abort(), { once: true });
  const events = streamChat(begun.turns, upstream.signal);
  // Pull the first event before committing to a stream so upstream rejections surface as real HTTP errors.
  let first: IteratorResult<AiStreamEvent>;
  try { first = await events.next(); }
  catch (error) {
    const message = error instanceof ProviderError ? error.message : "AI 服务暂时不可用，请稍后重试";
    await settle({ status: "error", error: message });
    if (error instanceof ProviderError) return c.json({ error: message }, error.status as 429 | 502 | 503);
    throw error;
  }

  return streamSSE(c, async (stream) => {
    stream.onAbort(() => upstream.abort());
    const relay = async (event: AiStreamEvent) => {
      if (event.type === "text") reply.content += event.delta;
      if (event.type === "reasoning") reply.reasoning += event.delta;
      if (!upstream.signal.aborted) await stream.writeSSE({ event: event.type, data: JSON.stringify(event) });
    };
    try {
      if (!first.done) {
        if (first.value.type === "error") throw new ProviderError(first.value.message, 502);
        await relay(first.value);
      }
      for await (const event of events) {
        if (event.type === "error") throw new ProviderError(event.message, 502);
        await relay(event);
      }
      await settle({ status: "done" });
      await stream.writeSSE({ event: "done", data: JSON.stringify({ type: "done" }) });
    } catch (error) {
      // A user-initiated stop keeps whatever was already produced as a finished answer.
      if (upstream.signal.aborted) return;
      console.error("AI stream failed", error);
      const message = error instanceof ProviderError ? error.message : "回答中断，请重试";
      await settle({ status: "error", error: message });
      await stream.writeSSE({ event: "error", data: JSON.stringify({ type: "error", message }) });
    } finally {
      await settle(upstream.signal.aborted ? { status: "done" } : { status: "error", error: INTERRUPTED });
    }
  });
});