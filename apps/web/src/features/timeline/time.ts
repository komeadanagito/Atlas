const pad = (value: number) => String(value).padStart(2, "0");

/** datetime-local uses wall-clock components, never a sliced UTC timestamp. */
export const toLocalDateTime = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const base = `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (date.getMilliseconds()) return `${base}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}`;
  return date.getSeconds() ? `${base}:${pad(date.getSeconds())}` : base;
};

export const parseLocalDateTime = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  // Reject normalized impossible dates and nonexistent daylight-saving wall times.
  const [year, month, day, hour, minute, second = 0] = value.split(/[-T:.]/).map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) return null;
  return date.toISOString();
};

export const parseDuration = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const minutes = Number(value);
  return Number.isSafeInteger(minutes) && minutes > 0 ? minutes : null;
};

export const endAt = (startAt: string, durationMin: number): Date | null => {
  if (!Number.isSafeInteger(durationMin) || durationMin <= 0) return null;
  const date = new Date(new Date(startAt).getTime() + durationMin * 60_000);
  return Number.isFinite(date.getTime()) ? date : null;
};
