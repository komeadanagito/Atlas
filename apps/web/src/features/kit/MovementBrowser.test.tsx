// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MovementBrowser } from "./MovementBrowser";

afterEach(cleanup);

describe("MovementBrowser", () => {
  it("starts with all training types and all methods selected", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "运动" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部运动" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "全部方式" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "跑步机" })).toBeTruthy();
  });

  it("filters catalog entries by type and method", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    const list = () => screen.queryByRole("list", { name: "运动条目" });

    fireEvent.click(screen.getByRole("button", { name: "有氧心肺" }));
    fireEvent.click(screen.getByRole("button", { name: "有氧器械" }));
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(13);
    expect(screen.getByRole("heading", { name: "划船机" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "骑行" }));
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("heading", { name: "公路骑行" })).toBeTruthy();

    // “全部运动”下的“户外／团体有氧”是预留分类，暂无条目。
    fireEvent.click(screen.getByRole("button", { name: "全部运动" }));
    fireEvent.click(screen.getByRole("button", { name: "户外／团体有氧" }));
    expect(list()).toBeNull();
    expect(screen.getByText("暂无内容")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "力量／抗阻（无氧）" }));
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(30);
    expect(screen.getByRole("heading", { name: "杠铃深蹲" })).toBeTruthy();
  });

  it("expands one card at a time to show details", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    const treadmill = screen.getByRole("button", { name: "跑步机" });
    const rower = screen.getByRole("button", { name: "划船机" });

    expect(treadmill.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(treadmill);
    expect(treadmill.getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(treadmill.getAttribute("aria-controls")!)!;
    expect(detail.getAttribute("aria-hidden")).toBe("false");
    expect(within(detail).getByText("肌群")).toBeTruthy();

    fireEvent.click(rower);
    expect(treadmill.getAttribute("aria-expanded")).toBe("false");
    expect(rower.getAttribute("aria-expanded")).toBe("true");
  });

  it("updates the method options and resets the selected method when type changes", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "力量／抗阻（无氧）" }));
    fireEvent.click(screen.getByRole("button", { name: "固定器械" }));
    expect(screen.getByRole("button", { name: "固定器械" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "有氧心肺" }));

    expect(screen.queryByRole("button", { name: "固定器械" })).toBeNull();
    expect(screen.getByRole("button", { name: "全部方式" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "有氧器械" })).toBeTruthy();
  });

  it("keeps the results canvas scrollable and returns to the hub", () => {
    const onBack = vi.fn();
    render(<MovementBrowser onBack={onBack} />);

    const methodGroup = screen.getByRole("group", { name: "器械与动作方式" });
    expect(within(methodGroup).getAllByRole("button")).toHaveLength(9);
    expect(screen.getByRole("main", { name: "运动" }).className).toContain("overflow-hidden");
    expect(screen.getByRole("region", { name: "运动目录内容" }).className).toContain("overflow-y-auto");
    expect(screen.queryByText("训练动作")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "返回百宝箱" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
