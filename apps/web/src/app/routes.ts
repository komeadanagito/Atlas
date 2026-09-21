export const NAV = [
  { id: "timeline", label: "时间轴" },
  { id: "kit", label: "百宝箱" },
] as const;

export type SectionId = (typeof NAV)[number]["id"] | KitModuleId;

export const KIT_MODULES = [
  { id: "fitness", label: "健身" },
  { id: "learning", label: "学习" },
  { id: "daily", label: "日常记录" },
  { id: "knowledge", label: "知识库" },
] as const;

export type KitModuleId = (typeof KIT_MODULES)[number]["id"];

export const isKitModule = (id: string): id is KitModuleId =>
  KIT_MODULES.some((item) => item.id === id);