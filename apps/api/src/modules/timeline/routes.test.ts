import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/middleware", () => ({
  requireAuth: async (c: { set: (key: string, value: string) => void }, next: () => Promise<void>) => {
    c.set("userId", "user-1");
    await next();
  },
}));

vi.mock("./repo", () => ({
  deleteItem: vi.fn(),
  insertItem: vi.fn((_userId, draft) => ({ id: "created", ...draft })),
  updateItem: vi.fn((_userId, id, draft) => ({ id, ...draft })),
}));
vi.mock("./service", () => ({ getTimeline: vi.fn(() => []) }));

import { parseDraft, timelineRoutes } from "./routes";
import { insertItem, updateItem } from "./repo";

const valid = { title: "  跨日安排  ", startAt: "2026-09-21T23:45:12.345+08:00", durationMin: 90, tag: "plan" };

beforeEach(() => vi.clearAllMocks());

describe("parseDraft", () => {
  it("preserves exact timestamp, seconds, offset and cross-day duration", () => {
    expect(parseDraft(valid)).toEqual({ ...valid, title: "跨日安排" });
    expect(parseDraft({ ...valid, durationMin: 2880 })).not.toBeNull();
    expect(parseDraft({ ...valid, tag: undefined })?.tag).toBe("plan");
    expect(parseDraft({ ...valid, tag: "note", note: "正文" })?.note).toBe("正文");
  });

  it.each([
    null, [], "text", 42, {},
    { ...valid, title: 123 }, { ...valid, title: " " },
    { ...valid, startAt: 123 }, { ...valid, startAt: "invalid" },
    { ...valid, startAt: "2026-02-30T10:00:00Z" },
    { ...valid, startAt: "2026-09-21T25:00:00Z" },
    { ...valid, startAt: "2026-09-21T10:00:00" },
    { ...valid, durationMin: "30" }, { ...valid, durationMin: 0 },
    { ...valid, durationMin: -1 }, { ...valid, durationMin: 1.5 },
    { ...valid, durationMin: Infinity }, { ...valid, durationMin: Number.MAX_SAFE_INTEGER },
    { ...valid, tag: "other" }, { ...valid, tag: null }, { ...valid, note: {} },
  ])("rejects malformed values %#", (value) => expect(parseDraft(value)).toBeNull());
});

describe("timeline draft routes", () => {
  it.each(["POST", "PATCH"])("returns 400 for malformed JSON in %s", async (method) => {
    const response = await timelineRoutes.request(method === "POST" ? "/" : "/item", {
      method, headers: { "Content-Type": "application/json" }, body: "{",
    });
    expect(response.status).toBe(400);
    expect(insertItem).not.toHaveBeenCalled();
    expect(updateItem).not.toHaveBeenCalled();
  });

  it.each(["POST", "PATCH"])("accepts cross-day schedules in %s", async (method) => {
    const response = await timelineRoutes.request(method === "POST" ? "/" : "/item", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid),
    });
    expect(response.status).toBe(method === "POST" ? 201 : 200);
    expect(await response.json()).toMatchObject({ startAt: valid.startAt, durationMin: 90 });
  });

  it("scopes writes to the authenticated user", async () => {
    const created = await timelineRoutes.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valid),
    });
    expect(created.status).toBe(201);
    expect(insertItem).toHaveBeenCalledWith("user-1", expect.objectContaining({ title: "跨日安排" }));

    const updated = await timelineRoutes.request("/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valid),
    });
    expect(updated.status).toBe(200);
    expect(updateItem).toHaveBeenCalledWith("user-1", "item", expect.objectContaining({ title: "跨日安排" }));
  });
});