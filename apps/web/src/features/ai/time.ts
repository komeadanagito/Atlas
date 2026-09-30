const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact sidebar timestamp: 刚刚 / 5分钟 / 3小时 / 2天 / 9月3日. */
export const relativeTime = (iso: string, now = Date.now()) => {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "";
  const gap = Math.max(0, now - at);
  if (gap < MINUTE) return "刚刚";
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)}分钟`;
  if (gap < DAY) return `${Math.floor(gap / HOUR)}小时`;
  if (gap < 7 * DAY) return `${Math.floor(gap / DAY)}天`;
  const date = new Date(at);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};