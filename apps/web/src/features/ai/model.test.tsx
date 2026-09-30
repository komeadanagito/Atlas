import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { chatReducer, emptyState, streamingIds, uid, type Message } from "./model";
import { Markdown, parseBlocks, safeHref } from "./Markdown";
import { findRanges } from "./findInChat";
import { relativeTime } from "./time";

const msg = (role: Message["role"], content: string, status: Message["status"] = "done"): Message =>
  ({ id: `${role}-${content}`, role, content, status });

describe("chatReducer", () => {
  it("creates a conversation optimistically and streams deltas into the reply", () => {
    const user = msg("user", "你好");
    const reply = msg("assistant", "", "streaming");
    let state = chatReducer(emptyState, { type: "ask", conversationId: "c1", user, reply });
    expect(state.activeId).toBe("c1");
    expect(state.conversations[0]).toMatchObject({ id: "c1", title: "你好" });
    expect(state.threads.c1).toEqual([user, reply]);
    state = chatReducer(state, { type: "delta", conversationId: "c1", replyId: reply.id, field: "content", text: "嗨" });
    state = chatReducer(state, { type: "settle", conversationId: "c1", replyId: reply.id });
    expect(state.threads.c1[1]).toMatchObject({ content: "嗨", status: "done" });
    expect(state.conversations[0].preview).toBe("嗨");
    expect(streamingIds(state).size).toBe(0);
  });

  it("tracks which conversations are streaming", () => {
    const state = chatReducer(emptyState, { type: "ask", conversationId: "c1", user: msg("user", "q"), reply: msg("assistant", "", "streaming") });
    expect([...streamingIds(state)]).toEqual(["c1"]);
    expect(state.conversations[0].preview).toBe("q");
  });

  it("keeps unsynced optimistic conversations when the server list arrives", () => {
    const state = chatReducer(emptyState, { type: "ask", conversationId: "local", user: msg("user", "a"), reply: msg("assistant", "", "streaming") });
    const listed = chatReducer(state, { type: "listed", conversations: [{ id: "old", title: "旧", updatedAt: "2026-01-01T00:00:00.000Z", preview: "" }] });
    expect(listed.listed).toBe(true);
    expect(listed.conversations.map((c) => c.id)).toEqual(["local", "old"]);
  });

  it("removes and restores a conversation with its thread", () => {
    const conversation = { id: "c1", title: "t", updatedAt: "2026-01-01T00:00:00.000Z", preview: "" };
    const loaded = chatReducer(chatReducer({ ...emptyState, conversations: [conversation], activeId: "c1" }, { type: "loaded", id: "c1", messages: [msg("user", "x")] }), { type: "remove", id: "c1" });
    expect(loaded).toMatchObject({ conversations: [], threads: {}, activeId: null });
    expect(chatReducer(loaded, { type: "restore", conversation, messages: [msg("user", "x")] }).threads.c1).toHaveLength(1);
  });

  it("resets a reply for retry", () => {
    const reply = { ...msg("assistant", "旧"), status: "error" as const, error: "失败", reasoning: "r" };
    const state = chatReducer({ ...emptyState, threads: { c1: [msg("user", "q"), reply] } }, { type: "retry", conversationId: "c1", replyId: reply.id });
    expect(state.threads.c1[1]).toEqual({ id: reply.id, role: "assistant", content: "", status: "streaming" });
  });
});

describe("uid", () => {
  it("produces a v4 uuid the server accepts", () => {
    expect(uid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe("Markdown", () => {
  it("parses blocks, keeping an unclosed fence open while streaming", () => {
    expect(parseBlocks("# 标题\n- a\n- b\n\n```ts\nconst x = 1")).toEqual([
      { kind: "heading", level: 1, text: "标题" },
      { kind: "list", ordered: false, items: ["a", "b"] },
      { kind: "code", lang: "ts", text: "const x = 1" },
    ]);
  });

  it("parses tables with alignment and renders task items", () => {
    expect(parseBlocks("| a | b |\n|:--|--:|\n| 1 | 2 |\n\n尾")).toEqual([
      { kind: "table", align: ["left", "right"], head: ["a", "b"], rows: [["1", "2"]] },
      { kind: "para", text: "尾" },
    ]);
    render(<Markdown source={"- [x] 完成\n- [ ] 待办"} />);
    expect(screen.getByText("已完成：")).toBeTruthy();
    expect(screen.getByText("未完成：")).toBeTruthy();
  });

  it("only links http(s) and never renders raw HTML", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    const { container } = render(<Markdown source={"<img src=x onerror=alert(1)> [bad](javascript:alert(1)) [ok](https://example.com) **粗**"} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("bad").closest("a")).toBeNull();
    expect(screen.getByText("ok").closest("a")?.getAttribute("href")).toBe("https://example.com/");
    expect(screen.getByText("粗").tagName).toBe("STRONG");
  });
});

describe("findRanges", () => {
  it("matches case-insensitively and skips chrome marked data-find-skip", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>Hello hello</p><div data-find-skip><span>hello</span></div>";
    expect(findRanges(root, "HELLO").map((r) => r.startOffset)).toEqual([0, 6]);
    expect(findRanges(root, " ")).toEqual([]);
  });
});

describe("relativeTime", () => {
  it("formats compact sidebar timestamps", () => {
    const now = Date.parse("2026-09-30T12:00:00Z");
    const ago = (ms: number) => new Date(now - ms).toISOString();
    expect(relativeTime(ago(10_000), now)).toBe("刚刚");
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5分钟");
    expect(relativeTime(ago(3 * 3_600_000), now)).toBe("3小时");
    expect(relativeTime(ago(2 * 86_400_000), now)).toBe("2天");
    expect(relativeTime("bad", now)).toBe("");
  });
});