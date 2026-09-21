import type { TimelineItem } from "@atlas/shared";

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export const formatClock = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDateKey = (iso: string) => formatLocalDate(new Date(iso));

export const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDateKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);

export const todayKeyOf = (now = new Date()) => formatLocalDate(now);

export const shiftDateKey = (dateKey: string, days: number) => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const shiftMonth = (dateKey: string, months: number) => {
  const date = parseDateKey(dateKey);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return formatLocalDate(date);
};

const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

export const startOfWeek = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - mondayIndex(date));
  return formatLocalDate(date);
};

export const weekdayOf = (dateKey: string) =>
  `周${WEEKDAYS[mondayIndex(parseDateKey(dateKey))]}`;

export const addMinutesToClock = (iso: string, minutes: number) => {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() + minutes);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const itemsOn = (items: TimelineItem[], dateKey: string) =>
  items
    .filter((item) => formatDateKey(item.startAt) === dateKey)
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));

export type WeekDay = {
  date: string;
  dayOfMonth: number;
  weekday: string;
  isToday: boolean;
  hasEvents: boolean;
  count: number;
};

const countByDay = (items: TimelineItem[]) => {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = formatDateKey(item.startAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

export const weekOf = (dateKey: string, items: TimelineItem[], todayKey: string): WeekDay[] => {
  const start = parseDateKey(startOfWeek(dateKey));
  const counts = countByDay(items);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const key = formatLocalDate(current);
    const count = counts.get(key) ?? 0;
    return {
      date: key,
      dayOfMonth: current.getDate(),
      weekday: WEEKDAYS[index],
      isToday: key === todayKey,
      hasEvents: count > 0,
      count,
    };
  });
};

export const weekSpanLabel = (dateKey: string) => {
  const start = parseDateKey(startOfWeek(dateKey));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getMonth() + 1}月${start.getDate()}日 – ${end.getDate()}日`;
  }
  return `${start.getMonth() + 1}月${start.getDate()}日 – ${end.getMonth() + 1}月${end.getDate()}日`;
};

export type MonthCell = {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  count: number;
};

export const monthGrid = (dateKey: string, items: TimelineItem[], todayKey: string): MonthCell[] => {
  const date = parseDateKey(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - mondayIndex(first));
  const counts = countByDay(items);
  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const key = formatLocalDate(current);
    return {
      date: key,
      dayOfMonth: current.getDate(),
      inMonth: current.getMonth() === date.getMonth(),
      isToday: key === todayKey,
      count: counts.get(key) ?? 0,
    };
  });
};

export const daysAround = (
  centerKey: string,
  items: TimelineItem[],
  todayKey: string,
  radius = 3,
): WeekDay[] => {
  const counts = countByDay(items);
  return Array.from({ length: radius * 2 + 1 }, (_, index) => {
    const key = shiftDateKey(centerKey, index - radius);
    const date = parseDateKey(key);
    const count = counts.get(key) ?? 0;
    return {
      date: key,
      dayOfMonth: date.getDate(),
      weekday: WEEKDAYS[mondayIndex(date)],
      isToday: key === todayKey,
      hasEvents: count > 0,
      count,
    };
  });
};

export const periodOf = (hour: number) => {
  if (hour < 6) return "凌晨";
  if (hour < 12) return "上午";
  if (hour < 14) return "中午";
  if (hour < 18) return "下午";
  return "夜晚";
};

export const WEEKDAY_LABELS = WEEKDAYS;