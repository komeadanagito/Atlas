export const MOVEMENT_TYPES = [
  { id: "all", label: "全部运动" },
  { id: "cardio", label: "有氧心肺" },
  { id: "strength", label: "力量／抗阻（无氧）" },
  { id: "mobility", label: "柔韧／活动度" },
  { id: "neuromotor", label: "平衡／协调" },
] as const;

export type MovementTypeId = (typeof MOVEMENT_TYPES)[number]["id"];

export type MovementMethod = {
  id: string;
  label: string;
};

/** One catalog entry; the data lives in movementCatalog.json so it can be edited by hand. */
export type MovementItem = {
  id: string;
  name: string;
  aliases: string[];
  type: Exclude<MovementTypeId, "all">;
  method: string;
  group: string;
  summary: string;
  muscles: string[];
  impact: "低" | "中" | "高";
  intensity: string;
  suitableFor: string[];
  tips: string;
};

export const filterMovementItems = (items: readonly MovementItem[], type: MovementTypeId, method: string) =>
  items.filter((item) => (type === "all" || item.type === type) && (method === "all" || item.method === method));

const ALL_METHODS: MovementMethod = { id: "all", label: "全部方式" };

export const MOVEMENT_METHODS: Record<MovementTypeId, readonly MovementMethod[]> = {
  all: [
    ALL_METHODS,
    { id: "cardio-equipment", label: "有氧器械" },
    { id: "outdoor-cardio", label: "户外／团体有氧" },
    { id: "fixed-equipment", label: "固定器械" },
    { id: "free-weights", label: "自由重量" },
    { id: "bodyweight", label: "自重训练" },
    { id: "resistance-tools", label: "弹力带／小工具" },
    { id: "mobility", label: "拉伸／活动度" },
    { id: "balance", label: "平衡／协调" },
  ],
  cardio: [
    ALL_METHODS,
    { id: "cardio-equipment", label: "有氧器械" },
    { id: "running-outdoor", label: "跑步／户外" },
    { id: "cycling", label: "骑行" },
    { id: "rowing-water", label: "划船／水上" },
    { id: "group-cardio", label: "团体有氧" },
  ],
  strength: [
    ALL_METHODS,
    { id: "fixed-equipment", label: "固定器械" },
    { id: "free-weights", label: "自由重量" },
    { id: "bodyweight", label: "自重训练" },
    { id: "resistance-tools", label: "弹力带／小工具" },
  ],
  mobility: [
    ALL_METHODS,
    { id: "dynamic-stretching", label: "动态拉伸" },
    { id: "static-stretching", label: "静态拉伸" },
    { id: "yoga", label: "瑜伽" },
    { id: "pilates", label: "普拉提" },
    { id: "release", label: "泡沫轴／放松" },
  ],
  neuromotor: [
    ALL_METHODS,
    { id: "balance-training", label: "平衡训练" },
    { id: "core-stability", label: "核心稳定" },
    { id: "agility-coordination", label: "敏捷／协调" },
    { id: "proprioception", label: "本体感觉" },
  ],
};
