// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TimelineItem } from "@atlas/shared";
import { HourWheel } from "./HourWheel";
import { removeTimeline } from "../api";

vi.mock("../api", () => ({
  removeTimeline: vi.fn(),
  createTimeline: vi.fn(),
  updateTimeline: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
});

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  class FakeObserver {
    observe() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", { writable: true, value: FakeObserver });
});

const item: TimelineItem = {
  id: "a",
  title: "晨跑",
  startAt: new Date(2026, 8, 21, 9, 0).toISOString(),
  durationMin: 30,
  tag: "plan",
};

describe("HourWheel", () => {
  it("keeps the event and shows an error when shortcut delete fails", async () => {
    vi.mocked(removeTimeline).mockRejectedValue(new Error("offline"));
    render(createElement(HourWheel, {
      items: [item],
      isToday: false,
      now: new Date(2026, 8, 21, 9),
      dateKey: "2026-09-21",
      onCreated: vi.fn(),
      onUpdated: vi.fn(),
      onDeleted: vi.fn(),
    }));
    fireEvent.click(screen.getByRole("button", { name: "管理 09:00 的日程" }));
    fireEvent.click(screen.getByRole("button", { name: "删除晨跑" }));
    expect(removeTimeline).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "确认删除晨跑" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("删除失败");
    expect(screen.getAllByText("晨跑").length).toBeGreaterThan(0);
  });

  it("does not start a snap animation after unmount", () => {
    vi.useFakeTimers();
    const frame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const { container, unmount } = render(createElement(HourWheel, {
      items: [],
      isToday: false,
      now: new Date(2026, 8, 21, 9),
      dateKey: "2026-09-21",
      onCreated: vi.fn(),
      onUpdated: vi.fn(),
      onDeleted: vi.fn(),
    }));
    const wheel = container.querySelector("[style*='perspective']");
    fireEvent.wheel(wheel!, { deltaY: 80 });
    unmount();
    act(() => { vi.advanceTimersByTime(300); });
    expect(frame).not.toHaveBeenCalled();
    frame.mockRestore();
  });
});
