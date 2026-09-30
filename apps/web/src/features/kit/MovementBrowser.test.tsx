// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MovementBrowser } from "./MovementBrowser";

afterEach(cleanup);

const list = () => screen.queryByRole("list", { name: "运动条目" });
const card = (name: string) => screen.getByRole("heading", { name }).closest("li")!;
const pickPart = (name: string) => fireEvent.click(within(screen.getByRole("group", { name: "训练部位" })).getByRole("button", { name }));

describe("MovementBrowser", () => {
  it("starts with all body parts and all methods selected", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "运动" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部部位" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "全部方式" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "跑步机" })).toBeTruthy();
  });

  it("lists multi-movement equipment first", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    const firstCard = within(list()!).getAllByRole("heading")[0];
    expect(firstCard.textContent).toBe("杠铃");
  });

  it.each(["胸大肌", "背部", "肩部", "手臂", "臀腿"])("shows barbell and dumbbell under %s", (partName) => {
    render(<MovementBrowser onBack={vi.fn()} />);
    pickPart(partName);
    expect(screen.getByRole("heading", { name: "杠铃" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "哑铃" })).toBeTruthy();
  });

  it("marks multi-movement equipment with a count badge, standalone movements without", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    expect(within(card("杠铃")).getByRole("img", { name: "9 个动作" })).toBeTruthy();
    expect(within(card("跑步机")).queryByRole("img")).toBeNull();

    pickPart("胸大肌");
    expect(within(card("杠铃")).getByRole("img", { name: "9 个动作，其中 2 个练胸大肌" })).toBeTruthy();
  });

  it("keeps movements folded until the equipment opens, then shows all of them related-first", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    pickPart("胸大肌");

    const barbellToggle = screen.getByRole("button", { name: "杠铃" });
    expect(barbellToggle.getAttribute("aria-expanded")).toBe("false");
    expect(within(card("杠铃")).queryByRole("button", { name: "杠铃卧推" })).toBeNull();

    fireEvent.click(barbellToggle);
    expect(barbellToggle.getAttribute("aria-expanded")).toBe("true");
    const moves = within(within(card("杠铃")).getByRole("list", { name: "杠铃动作" })).getAllByRole("button");
    expect(moves).toHaveLength(9);
    expect(moves.slice(0, 2).map((move) => move.textContent)).toEqual([
      expect.stringMatching(/^杠铃卧推/),
      expect.stringMatching(/^上斜卧推/),
    ]);
    expect(within(card("杠铃")).getByText("2 个练胸大肌")).toBeTruthy();
  });

  it("switches an open equipment card between grid and list views", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "哑铃" }));

    const dumbbell = within(card("哑铃"));
    expect(dumbbell.getByRole("button", { name: "卡片视图" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(dumbbell.getByRole("button", { name: "列表视图" }));

    const rows = within(dumbbell.getByRole("list", { name: "哑铃动作" })).getAllByRole("listitem");
    expect(rows).toHaveLength(9);
    expect(dumbbell.getByText(/上臂贴近耳朵/)).toBeTruthy();
  });

  it("keeps a single card open across equipment and standalone movements", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    const barbell = screen.getByRole("button", { name: "杠铃" });
    const treadmill = screen.getByRole("button", { name: "跑步机" });

    fireEvent.click(barbell);
    fireEvent.click(treadmill);
    expect(barbell.getAttribute("aria-expanded")).toBe("false");
    expect(treadmill.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens a movement's detail inside its equipment card", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    pickPart("胸大肌");
    fireEvent.click(screen.getByRole("button", { name: "杠铃" }));

    const barbell = within(card("杠铃"));
    const benchPress = barbell.getByRole("button", { name: "杠铃卧推" });
    const detail = document.getElementById(benchPress.getAttribute("aria-controls")!)!;
    expect(detail.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(benchPress);
    expect(benchPress.getAttribute("aria-pressed")).toBe("true");
    expect(detail.getAttribute("aria-hidden")).toBe("false");
    expect(within(detail).getByText(/乳头连线/)).toBeTruthy();

    fireEvent.click(benchPress);
    expect(detail.getAttribute("aria-hidden")).toBe("true");
  });

  it("groups same-equipment movements under one card", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    for (const name of ["哑铃弯举", "硬拉", "引体向上", "坐姿夹胸机", "蝴蝶机反向飞鸟", "帕洛夫推举", "药球砸地"]) {
      expect(screen.queryByRole("heading", { name })).toBeNull();
    }
    const expectMovement = (equipment: string, movement: string) => {
      fireEvent.click(screen.getByRole("button", { name: equipment }));
      expect(within(card(equipment)).getByRole("button", { name: movement })).toBeTruthy();
    };
    expectMovement("单杠", "引体向上");
    expectMovement("蝴蝶机", "蝴蝶机反向飞鸟");
    expectMovement("龙门架（绳索）", "帕洛夫推举");
  });

  it("narrows the list further when a method is selected within a part", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    pickPart("胸大肌");
    const allCount = within(list()!).getAllByRole("heading").length;

    fireEvent.click(screen.getByRole("button", { name: "固定器械" }));
    const fixedCount = within(list()!).getAllByRole("heading").length;
    expect(fixedCount).toBeLessThan(allCount);
    expect(screen.getByRole("heading", { name: "坐姿推胸机" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "杠铃" })).toBeNull();
  });

  it("never offers a method that leads to an empty list", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    for (const name of ["户外／团体有氧", "拉伸／活动度", "平衡／协调"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(within(list()!).getAllByRole("heading").length).toBeGreaterThan(0);
    }
  });

  it("expands one standalone card at a time", () => {
    render(<MovementBrowser onBack={vi.fn()} />);
    const treadmill = screen.getByRole("button", { name: "跑步机" });
    const rower = screen.getByRole("button", { name: "划船机" });

    fireEvent.click(treadmill);
    expect(treadmill.getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(treadmill.getAttribute("aria-controls")!)!;
    expect(within(detail).getByText("肌群")).toBeTruthy();

    fireEvent.click(rower);
    expect(treadmill.getAttribute("aria-expanded")).toBe("false");
    expect(rower.getAttribute("aria-expanded")).toBe("true");
  });

  it("resets the selected method when the body part changes", () => {
    render(<MovementBrowser onBack={vi.fn()} />);

    pickPart("胸大肌");
    fireEvent.click(screen.getByRole("button", { name: "固定器械" }));
    expect(screen.getByRole("button", { name: "固定器械" }).getAttribute("aria-pressed")).toBe("true");

    pickPart("臀腿");
    expect(screen.getByRole("button", { name: "全部方式" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "自由重量" })).toBeTruthy();
  });

  it("keeps the results canvas scrollable and returns to the hub", () => {
    const onBack = vi.fn();
    render(<MovementBrowser onBack={onBack} />);

    const methodGroup = () => screen.getByRole("group", { name: "器械与动作方式" });
    expect(within(methodGroup()).getAllByRole("button")).toHaveLength(9);
    pickPart("胸大肌");
    expect(within(methodGroup()).getAllByRole("button")).toHaveLength(5);

    expect(screen.getByRole("main", { name: "运动" }).className).toContain("overflow-hidden");
    expect(screen.getByRole("region", { name: "运动目录内容" }).className).toContain("overflow-y-auto");
    fireEvent.click(screen.getByRole("button", { name: "返回百宝箱" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});