import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/middleware", () => ({
  requireAuth: async (c: { set: (key: string, value: string) => void }, next: () => Promise<void>) => {
    c.set("userId", "user-1");
    await next();
  },
}));

vi.mock("./repo", () => ({
  INTERRUPTED: "回答已中断",
  beginChat: vi.fn(),
  finishReply: vi.fn(async () => undefined),
  listConversations: vi.fn(async () => []),
  getConversation: vi.fn(async () => null),
  deleteConversation: vi.fn(async () => false),
}));

import { historyTurns, readSse } from "@atlas/shared";
import { aiRoutes, createBudget, parseChatRequest } from "./routes";
import { toEvents } from "./provider";
import { beginChat, deleteConversation, finishReply, getConversation } from "./repo";

const C = "11111111-1111-4111-8111-111111111111";
const U = "22222222-2222-4222-8222-222222222222";
const R = "33333333-3333-4333-8333-333333333333";
const ask = { kind: "ask", conversationId: C, userMessageId: U, replyId: R, content: " 你好 " };

const streamOf = (...chunks: string[]) => new ReadableStream<Uint8Array>({
  start(controller) {
    const encoder = new TextEncoder();
    for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
    controller.close();
  },
});

const collect = async <T>(iterable: AsyncIterable<T>) => {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
};

const delta = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AI_API_KEY", "test-key");
  vi.mocked(beginChat).mockResolvedValue({ ok: true, turns: [{ role: "user", content: "你好" }] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("readSse", () => {
  it("reassembles events across chunk and CRLF boundaries", async () => {
    const events = await collect(readSse(streamOf("data: a", "\r", "\n\r\nevent: x\ndata: 1\ndata: 2\n\n: ping\n\ndata: tail")));
    expect(events).toEqual([
      { event: "message", data: "a" },
      { event: "x", data: "1\n2" },
      { event: "message", data: "tail" },
    ]);
  });
});

describe("historyTurns", () => {
  it("drops failed or pending replies and never starts with the assistant", () => {
    expect(historyTurns([
      { role: "assistant", content: "orphan", status: "done" },
      { role: "user", content: "a", status: "done" },
      { role: "assistant", content: "bad", status: "error" },
      { role: "user", content: " b ", status: "done" },
      { role: "assistant", content: "", status: "streaming" },
    ])).toEqual([{ role: "user", content: "a" }, { role: "user", content: "b" }]);
  });
});

describe("parseChatRequest", () => {
  it("accepts ask and retry with trimmed content", () => {
    expect(parseChatRequest(ask)).toEqual({ ...ask, content: "你好" });
    expect(parseChatRequest({ kind: "retry", conversationId: C, replyId: R })).toEqual({ kind: "retry", conversationId: C, replyId: R });
  });
  it.each([
    null, [], {}, { ...ask, kind: "other" }, { ...ask, conversationId: "1" }, { ...ask, replyId: U },
    { ...ask, content: " " }, { ...ask, content: 1 }, { ...ask, content: "x".repeat(8001) },
  ])("rejects malformed payload %#", (value) => expect(parseChatRequest(value)).toBeNull());
});

describe("createBudget", () => {
  it("resets after the window and isolates keys", () => {
    let now = 0;
    const allow = createBudget(2, 1000, () => now);
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([true, true, false, true]);
    now = 1000;
    expect(allow("a")).toBe(true);
  });
});

describe("toEvents", () => {
  it("maps reasoning and content deltas and ignores noise", () => {
    expect(toEvents(JSON.stringify({ choices: [{ delta: { reasoning: "想", content: "答" } }] })))
      .toEqual([{ type: "reasoning", delta: "想" }, { type: "text", delta: "答" }]);
    expect(toEvents("[DONE]")).toEqual([]);
    expect(toEvents("not json")).toEqual([]);
    expect(toEvents(JSON.stringify({ error: { message: "secret detail" } }))[0]).toMatchObject({ type: "error" });
  });
});

describe("conversation routes", () => {
  it("scopes reads and deletes to the user and rejects non-uuid ids", async () => {
    expect((await aiRoutes.request(`/conversations/${C}`)).status).toBe(404);
    expect(getConversation).toHaveBeenCalledWith("user-1", C);
    expect((await aiRoutes.request("/conversations/abc")).status).toBe(404);
    expect(getConversation).toHaveBeenCalledTimes(1);
    vi.mocked(deleteConversation).mockResolvedValueOnce(true);
    expect((await aiRoutes.request(`/conversations/${C}`, { method: "DELETE" })).status).toBe(200);
    expect(deleteConversation).toHaveBeenCalledWith("user-1", C);
  });
});

describe("POST /chat", () => {
  const post = (body: unknown = ask) => aiRoutes.request("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("returns 503 when no key is configured, before touching storage", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect((await post()).status).toBe(503);
    expect(beginChat).not.toHaveBeenCalled();
  });

  it.each([["not_found", 404], ["conflict", 409]] as const)("maps %s to %i", async (reason, status) => {
    vi.mocked(beginChat).mockResolvedValueOnce({ ok: false, reason });
    expect((await post()).status).toBe(status);
  });

  it("streams deltas and persists the finished reply", async () => {
    vi.stubEnv("AI_MODEL", "test/model");
    const fetchMock = vi.fn(async () => new Response(streamOf(delta("你"), `${delta("好")}data: [DONE]\n\n`), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await post();
    expect(response.status).toBe(200);
    const events = (await collect(readSse(response.body!))).map((e) => JSON.parse(e.data));
    expect(events).toEqual([{ type: "text", delta: "你" }, { type: "text", delta: "好" }, { type: "done" }]);
    expect(beginChat).toHaveBeenCalledWith("user-1", { ...ask, content: "你好" });
    expect(finishReply).toHaveBeenCalledTimes(1);
    expect(finishReply).toHaveBeenCalledWith(R, { content: "你好", reasoning: "", status: "done" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ model: "test/model", stream: true });
    expect(JSON.stringify(events)).not.toContain("test-key");
  });

  it("persists partial output as an error when upstream fails mid-stream", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(streamOf(delta("半"), `data: ${JSON.stringify({ error: { message: "x" } })}\n\n`), { status: 200 })));
    const events = (await collect(readSse((await post()).body!))).map((e) => JSON.parse(e.data));
    expect(events.at(-1)).toMatchObject({ type: "error" });
    expect(finishReply).toHaveBeenCalledTimes(1);
    expect(finishReply).toHaveBeenCalledWith(R, expect.objectContaining({ content: "半", status: "error" }));
  });

  it("surfaces upstream rejection as an HTTP error and settles the reply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad key", { status: 401 })));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await post();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI 服务凭据无效，请联系管理员检查配置" });
    expect(finishReply).toHaveBeenCalledWith(R, expect.objectContaining({ status: "error", error: "AI 服务凭据无效，请联系管理员检查配置" }));
  });
});