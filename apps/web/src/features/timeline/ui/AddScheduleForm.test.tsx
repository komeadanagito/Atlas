// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimelineItem } from "@atlas/shared";
import { AddScheduleForm } from "./AddScheduleForm";
import { createTimeline, removeTimeline, updateTimeline } from "../api";

vi.mock("../api", () => ({ createTimeline: vi.fn(), updateTimeline: vi.fn(), removeTimeline: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const callbacks = () => ({ onCreated: vi.fn(), onUpdated: vi.fn(), onDeleted: vi.fn() });

describe("AddScheduleForm", () => {
  it("submits title and start/end minutes for new schedule", async () => {
    const newItem: TimelineItem = {
      id: "test-1",
      title: "晨跑",
      startAt: new Date(2026, 8, 21, 9, 10).toISOString(),
      durationMin: 30,
      tag: "plan",
    };
    vi.mocked(createTimeline).mockResolvedValue(newItem);
    const handlers = callbacks();
    render(createElement(AddScheduleForm, { dateKey: "2026-09-21", hour: 9, ...handlers }));

    fireEvent.change(screen.getByPlaceholderText("例如：晨跑、周会、阅读"), { target: { value: "晨跑" } });
    fireEvent.click(screen.getByRole("button", { name: "开始时间加一分钟" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "添加这条日程" }));
    });

    expect(createTimeline).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "晨跑",
        durationMin: 29, // 30 - 1
        tag: "plan",
      })
    );
    expect(handlers.onCreated).toHaveBeenCalledWith(newItem);
  });

  it("loads editing item and submits updated data", async () => {
    const existing: TimelineItem = {
      id: "test-2",
      title: "读书",
      startAt: new Date(2026, 8, 21, 14, 15).toISOString(),
      durationMin: 30,
      tag: "plan",
    };
    vi.mocked(updateTimeline).mockResolvedValue({ ...existing, title: "深度阅读" });
    const handlers = callbacks();
    render(createElement(AddScheduleForm, { dateKey: "2026-09-21", hour: 14, editing: existing, ...handlers }));

    expect((screen.getByLabelText("开始时间分钟") as HTMLInputElement).value).toBe("15");
    expect((screen.getByLabelText("结束时间分钟") as HTMLInputElement).value).toBe("45");

    fireEvent.change(screen.getByPlaceholderText("例如：晨跑、周会、阅读"), { target: { value: "深度阅读" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    });

    expect(updateTimeline).toHaveBeenCalledWith(
      "test-2",
      expect.objectContaining({
        title: "深度阅读",
        durationMin: 30,
      })
    );
    expect(handlers.onUpdated).toHaveBeenCalled();
  });

  it("validates empty title and invalid time span", async () => {
    const handlers = callbacks();
    render(createElement(AddScheduleForm, { dateKey: "2026-09-21", hour: 9, ...handlers }));

    // Empty title
    fireEvent.click(screen.getByRole("button", { name: "添加这条日程" }));
    expect(screen.getByRole("alert").textContent).toContain("请填写事件名称");
    expect(createTimeline).not.toHaveBeenCalled();

    // End minute <= start minute
    fireEvent.change(screen.getByPlaceholderText("例如：晨跑、周会、阅读"), { target: { value: "测试" } });
    fireEvent.change(screen.getByLabelText("开始时间分钟"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("结束时间分钟"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "添加这条日程" }));
    expect(screen.getByRole("alert").textContent).toContain("结束时间需晚于开始时间");
  });

  it("calls delete handler when removing an existing item", async () => {
    const existing: TimelineItem = {
      id: "test-del",
      title: "散步",
      startAt: new Date(2026, 8, 21, 19, 0).toISOString(),
      durationMin: 20,
      tag: "plan",
    };
    vi.mocked(removeTimeline).mockResolvedValue({ ok: true });
    const handlers = callbacks();
    render(createElement(AddScheduleForm, { dateKey: "2026-09-21", hour: 19, editing: existing, ...handlers }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "删除这条日程" }));
    });

    expect(removeTimeline).toHaveBeenCalledWith("test-del");
    expect(handlers.onDeleted).toHaveBeenCalledWith("test-del");
  });
});
