export type MovementType = "cardio" | "strength" | "mobility" | "neuromotor";

/** One exercise under a piece of equipment. */
export type MovementSubItem = {
  id: string;
  name: string;
  summary: string;
  muscles: string[];
  intensity: string;
  tips: string;
};

/** One catalog entry: either a piece of equipment with `movements`, or a standalone movement. */
export type MovementItem = {
  id: string;
  name: string;
  aliases: string[];
  type: MovementType;
  method: string;
  /** Descriptive grouping kept for editors; filtering is derived from muscles instead. */
  group: string;
  summary: string;
  muscles: string[];
  impact: "低" | "中" | "高";
  intensity: string;
  suitableFor: string[];
  tips: string;
  movements?: MovementSubItem[];
};

export const BODY_PARTS = [
  { id: "all", label: "全部部位" },
  { id: "chest", label: "胸大肌" },
  { id: "back", label: "背部" },
  { id: "shoulders", label: "肩部" },
  { id: "arms", label: "手臂" },
  { id: "legs", label: "臀腿" },
  { id: "core", label: "核心" },
  { id: "fullbody", label: "全身" },
] as const;

export type BodyPartId = (typeof BODY_PARTS)[number]["id"];
type MusclePart = Exclude<BodyPartId, "all" | "fullbody">;

const PART_MUSCLES: Record<MusclePart, readonly string[]> = {
  chest: ["胸大肌", "胸肩"],
  back: ["背阔肌", "斜方肌中束", "斜方肌上束", "菱形肌", "竖脊肌", "下背部", "上背部", "脊柱伸肌", "大圆肌", "背部", "胸背", "肩胛稳定肌"],
  shoulders: ["三角肌", "三角肌前束", "三角肌中束", "三角肌后束", "肩部", "肩袖肌群", "肩部稳定肌"],
  arms: ["肱二头肌", "肱三头肌", "肱肌", "前臂肌群", "手臂"],
  legs: [
    "股四头肌", "腘绳肌", "臀大肌", "臀中肌", "臀肌", "小腿三头肌", "腓肠肌", "比目鱼肌", "内收肌", "髋屈肌",
    "梨状肌", "髂胫束", "阔筋膜张肌", "股外侧肌", "膝稳定肌", "踝稳定肌",
  ],
  core: ["核心", "腹直肌", "腹横肌", "腹斜肌", "腹部"],
};

const MUSCLE_TO_PART: Record<string, MusclePart> = Object.fromEntries(
  (Object.entries(PART_MUSCLES) as [MusclePart, readonly string[]][]).flatMap(([part, muscles]) =>
    muscles.map((muscle) => [muscle, part] as const),
  ),
);

const partsOf = (muscles: readonly string[]) => muscles.flatMap((muscle) => MUSCLE_TO_PART[muscle] ?? []);

/** A movement belongs to the part of its first mappable muscle, i.e. its prime mover. */
export const primaryPart = (muscles: readonly string[]): MusclePart | undefined => partsOf(muscles)[0];

const isFullBody = (item: MovementItem) =>
  item.type === "cardio" || (!item.movements && new Set(partsOf(item.muscles)).size >= 3);

const trainsPart = (item: MovementItem, part: MusclePart) =>
  (item.type === "strength" || item.type === "neuromotor") &&
  (item.movements
    ? item.movements.some((movement) => primaryPart(movement.muscles) === part)
    : primaryPart(item.muscles) === part);

export const matchesPart = (item: MovementItem, part: BodyPartId) =>
  part === "all" ? true : part === "fullbody" ? isFullBody(item) : trainsPart(item, part);

/** Movements of an equipment entry that target the part; all of them when no single part applies. */
export const focusMovements = (item: MovementItem, part: BodyPartId): MovementSubItem[] => {
  const movements = item.movements ?? [];
  if (part === "all" || part === "fullbody") return movements;
  return movements.filter((movement) => primaryPart(movement.muscles) === part);
};

export type MethodFilter = { id: string; label: string; methods: readonly string[] };

/** Sidebar options; each maps to the raw `method` values it covers. */
export const METHOD_FILTERS: readonly MethodFilter[] = [
  { id: "all", label: "全部方式", methods: [] },
  { id: "cardio-equipment", label: "有氧器械", methods: ["cardio-equipment"] },
  { id: "outdoor-cardio", label: "户外／团体有氧", methods: ["running-outdoor", "cycling", "rowing-water", "group-cardio"] },
  { id: "fixed-equipment", label: "固定器械", methods: ["fixed-equipment"] },
  { id: "free-weights", label: "自由重量", methods: ["free-weights"] },
  { id: "bodyweight", label: "自重训练", methods: ["bodyweight"] },
  { id: "resistance-tools", label: "弹力带／小工具", methods: ["resistance-tools"] },
  { id: "mobility", label: "拉伸／活动度", methods: ["dynamic-stretching", "static-stretching", "yoga", "pilates", "release"] },
  { id: "balance", label: "平衡／协调", methods: ["balance-training", "core-stability", "agility-coordination", "proprioception"] },
];

const matchesMethod = (item: MovementItem, filterId: string) =>
  filterId === "all" || (METHOD_FILTERS.find((filter) => filter.id === filterId)?.methods.includes(item.method) ?? false);

/** Only offer methods that have at least one entry for the part, so no option leads to an empty list. */
export const methodsForPart = (items: readonly MovementItem[], part: BodyPartId): MethodFilter[] => {
  const partItems = items.filter((item) => matchesPart(item, part));
  return METHOD_FILTERS.filter((filter) => filter.id === "all" || partItems.some((item) => matchesMethod(item, filter.id)));
};

export type CatalogEntry = { item: MovementItem; focus: MovementSubItem[] };

/** Equipment with more matching movements comes first; standalone movements keep catalog order. */
export const browseCatalog = (items: readonly MovementItem[], part: BodyPartId, method: string): CatalogEntry[] =>
  items
    .filter((item) => matchesPart(item, part) && matchesMethod(item, method))
    .map((item) => ({ item, focus: focusMovements(item, part) }))
    .sort((a, b) => b.focus.length - a.focus.length);