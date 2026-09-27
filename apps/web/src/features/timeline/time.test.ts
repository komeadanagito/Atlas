import { describe, expect, it } from "vitest";
import { endAt, parseDuration, parseLocalDateTime, toLocalDateTime } from "./time";
import { addMinutesToClock, formatLocalDate } from "./model";

describe("timeline time helpers", () => {
  it("fills local components without converting them to UTC", () => {
    const local = new Date(2026, 8, 21, 23, 45, 12, 345);
    expect(toLocalDateTime(local.toISOString())).toBe("2026-09-21T23:45:12.345");
    expect(parseLocalDateTime("2026-09-21T23:45:12.345")).toBe(local.toISOString());
  });

  it("keeps durations across hours and days", () => {
    const start = new Date(2026, 8, 21, 23, 45, 12, 345).toISOString();
    expect(toLocalDateTime(endAt(start, 90)!.toISOString())).toBe("2026-09-22T01:15:12.345");
    expect(addMinutesToClock(start, 90)).toBe("2026-09-22 01:15");
    expect(addMinutesToClock(new Date(2026, 8, 21, 10, 45).toISOString(), 90)).toBe("12:15");
  });

  it.each(["", "0", "-1", "1.5", "Infinity", "1e3", "9007199254740992"])("rejects duration %s", (value) => {
    expect(parseDuration(value)).toBeNull();
  });

  it("accepts unbounded practical cross-day durations and rejects impossible dates", () => {
    expect(parseDuration("2880")).toBe(2880);
    expect(parseLocalDateTime("2026-02-30T10:00")).toBeNull();
    expect(parseLocalDateTime("2026-13-01T10:00")).toBeNull();
    expect(parseLocalDateTime("2026-09-21T25:00")).toBeNull();
    expect(endAt("bad", 30)).toBeNull();
    expect(endAt("2026-09-21T10:00:00Z", Number.MAX_SAFE_INTEGER)).toBeNull();
  });

  it("calculates elapsed milliseconds through daylight-saving transitions", () => {
    // Run in America/New_York to exercise a repeated local hour, and in UTC/Asia/Shanghai.
    const start = "2026-11-01T01:30:00-04:00";
    const end = endAt(start, 60)!;
    expect(end.toISOString()).toBe("2026-11-01T06:30:00.000Z");
    const clock = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    const expected = formatLocalDate(new Date(start)) === formatLocalDate(end) ? clock : `${formatLocalDate(end)} ${clock}`;
    expect(addMinutesToClock(start, 60)).toBe(expected);
  });
});
