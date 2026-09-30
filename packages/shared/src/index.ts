export const TIMELINE_TAGS = ["plan", "note"] as const;

export type TimelineTag = (typeof TIMELINE_TAGS)[number];

export type TimelineItem = {
  id: string;
  startAt: string;
  durationMin: number;
  title: string;
  note?: string;
  tag: TimelineTag;
};

export const TAG_META: Record<TimelineTag, { label: string }> = {
  plan: { label: "安排" },
  note: { label: "备忘" },
};

export type TimelineDraft = {
  startAt: string;
  durationMin: number;
  title: string;
  note?: string;
  tag: TimelineTag;
};

export type User = {
  id: string;
  username: string;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  password: string;
};

export const AI_LIMITS = { maxTurns: 40, maxTurnChars: 8000, maxTotalChars: 24000 } as const;

export type ChatRole = "user" | "assistant";

export type ChatTurn = { role: ChatRole; content: string };

export type AiStatus = { configured: boolean; model: string | null };

export type AiMessageStatus = "streaming" | "done" | "error";

export type AiMessage = {
  id: string;
  role: ChatRole;
  content: string;
  reasoning?: string;
  status: AiMessageStatus;
  error?: string;
};

export type AiConversationSummary = { id: string; title: string; updatedAt: string; preview: string };

export const previewOf = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 80);

export type AiConversation = AiConversationSummary & { messages: AiMessage[] };

/** Client-generated UUIDs let the UI render optimistically; the server validates and owns persistence. */
export type AiChatRequest =
  | { kind: "ask"; conversationId: string; userMessageId: string; replyId: string; content: string }
  | { kind: "retry"; conversationId: string; replyId: string };

export const conversationTitle = (text: string) => {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > 24 ? `${line.slice(0, 24)}…` : line || "新对话";
};

/** Upstream history: finished turns only, newest-first within budget, never led by the assistant. */
export const historyTurns = (messages: Pick<AiMessage, "role" | "content" | "status">[]): ChatTurn[] => {
  const usable = messages
    .filter((m) => m.content.trim() && (m.role === "user" || m.status === "done"))
    .map((m): ChatTurn => ({ role: m.role, content: m.content.trim().slice(0, AI_LIMITS.maxTurnChars) }));
  const picked: ChatTurn[] = [];
  let total = 0;
  for (let i = usable.length - 1; i >= 0 && picked.length < AI_LIMITS.maxTurns; i--) {
    total += usable[i].content.length;
    if (total > AI_LIMITS.maxTotalChars) break;
    picked.unshift(usable[i]);
  }
  while (picked[0]?.role === "assistant") picked.shift();
  return picked;
};

/** Events the Atlas API streams to the browser; upstream provider formats never leak past the server. */
export type AiStreamEvent =
  | { type: "text"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type SseEvent = { event: string; data: string };

/** Parses a text/event-stream body into discrete events; tolerant of CRLF and arbitrary chunk boundaries. */
export async function* readSse(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // A lone trailing "\r" may be the first half of a CRLF split across chunks; hold it back.
  let carry = "";
  const parse = (block: string): SseEvent | null => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") event = value;
      else if (field === "data") data.push(value);
    }
    return data.length ? { event, data: data.join("\n") } : null;
  };
  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      let text = carry + decoder.decode(value, { stream: !done });
      carry = !done && text.endsWith("\r") ? "\r" : "";
      if (carry) text = text.slice(0, -1);
      buffer += text.replace(/\r\n?/g, "\n");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const parsed = parse(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (parsed) yield parsed;
      }
      if (done) {
        const tail = parse(buffer);
        if (tail) yield tail;
        return;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}