import { describe, expect, it } from "vitest";
import catalogData from "./movementCatalog.json";
import { BODY_PARTS, browseCatalog, METHOD_FILTERS, primaryPart, type MovementItem } from "./movementCategories";

const CATALOG = catalogData as MovementItem[];

describe("movement catalog alignment", () => {
  it("uses unique ids across equipment and movements", () => {
    const ids = CATALOG.flatMap((item) => [item.id, ...(item.movements ?? []).map((movement) => movement.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only groups equipment that really has several movements", () => {
    for (const item of CATALOG.filter((entry) => entry.movements)) {
      expect(item.movements!.length, item.name).toBeGreaterThanOrEqual(2);
    }
  });

  it("maps every strength movement to a body part through its prime mover", () => {
    const strength = CATALOG.filter((item) => item.type === "strength");
    const muscleLists = strength.flatMap((item) => (item.movements ? item.movements.map((movement) => movement.muscles) : [item.muscles]));
    for (const muscles of muscleLists) expect(primaryPart(muscles), muscles.join("/")).toBeDefined();
  });

  it("covers every raw method with a sidebar filter", () => {
    const covered = new Set(METHOD_FILTERS.flatMap((filter) => filter.methods));
    for (const item of CATALOG) expect(covered.has(item.method), `${item.name}: ${item.method}`).toBe(true);
  });

  it("gives every body part some content", () => {
    for (const part of BODY_PARTS) expect(browseCatalog(CATALOG, part.id, "all").length, part.label).toBeGreaterThan(0);
  });

  it("keeps an equipment card's focus to movements for that part", () => {
    const barbell = browseCatalog(CATALOG, "back", "all").find(({ item }) => item.id === "barbell")!;
    expect(barbell.focus.map((movement) => movement.name)).toContain("杠铃划船");
    expect(barbell.focus.map((movement) => movement.name)).not.toContain("杠铃卧推");
  });
});