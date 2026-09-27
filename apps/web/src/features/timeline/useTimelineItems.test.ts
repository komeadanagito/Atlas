// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimelineItem } from "@atlas/shared";
import { listTimeline } from "./api";
import { useTimelineItems } from "./useTimelineItems";

vi.mock("./api", () => ({ listTimeline: vi.fn() }));
vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-1", username: "admin", createdAt: "2026-09-22T00:00:00.000Z" },
    loading: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const item = (id: string, title = id): TimelineItem => ({
  id,
  title,
  startAt: "2026-09-21T09:00:00.000Z",
  durationMin: 30,
  tag: "plan",
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

const Probe = () => {
  const { items, loading, error, retry, upsert, remove } = useTimelineItems();
  return createElement("div", null,
    createElement("p", null, loading ? "loading" : "ready"),
    error ? createElement("p", { role: "alert" }, error) : null,
    createElement("ul", null, items.map((entry) => createElement("li", { key: entry.id }, entry.title))),
    createElement("button", { type: "button", onClick: retry }, "retry"),
    createElement("button", { type: "button", onClick: () => upsert(item("local", "本地新增")) }, "add"),
    createElement("button", { type: "button", onClick: () => remove("keep") }, "drop"),
  );
};

describe("useTimelineItems", () => {
  it("keeps existing items and shows an error instead of an empty list", async () => {
    const first = deferred<TimelineItem[]>();
    const second = deferred<TimelineItem[]>();
    vi.mocked(listTimeline).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(createElement(Probe));
    await act(async () => first.resolve([item("keep", "已有")]));
    expect(screen.getByText("已有")).toBeTruthy();
    await act(async () => screen.getByRole("button", { name: "retry" }).click());
    await act(async () => second.reject(new Error("offline")));
    expect(screen.getByRole("alert").textContent).toContain("加载失败");
    expect(screen.getByText("已有")).toBeTruthy();
  });

  it("does not let a slow list response overwrite a newer local change", async () => {
    const first = deferred<TimelineItem[]>();
    vi.mocked(listTimeline).mockReturnValueOnce(first.promise);
    render(createElement(Probe));
    await act(async () => screen.getByRole("button", { name: "add" }).click());
    await act(async () => first.resolve([item("server", "服务器")]));
    expect(screen.getByText("本地新增")).toBeTruthy();
    expect(screen.getByText("服务器")).toBeTruthy();
  });
});
