export const TIMELINE_TAGS = ["plan", "note"] as const;

export type TimelineTag = (typeof TIMELINE_TAGS)[number];

export type TimelineItem = {
  id: string;
  startAt: string;
  durationMin: number;
  title: string;
  note?: string;
  tag: TimelineTag;
};

export const TAG_META: Record<TimelineTag, { label: string }> = {
  plan: { label: "安排" },
  note: { label: "备忘" },
};

export type TimelineDraft = {
  startAt: string;
  durationMin: number;
  title: string;
  note?: string;
  tag: TimelineTag;
};

export type User = {
  id: string;
  username: string;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  password: string;
};