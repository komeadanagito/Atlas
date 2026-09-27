// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RangeSwitch } from "./RangeSwitch";

afterEach(cleanup);

describe("RangeSwitch", () => {
  it("exposes pressed state and moves with arrow keys", () => {
    const onChange = vi.fn();
    render(createElement(RangeSwitch, { value: "day", onChange }));
    const day = screen.getByRole("button", { name: "日视图" });
    expect(day.getAttribute("aria-pressed")).toBe("true");
    day.focus();
    fireEvent.keyDown(day, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("week");
  });
});
