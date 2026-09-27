import { Hono } from "hono";
import { TIMELINE_TAGS, type TimelineDraft, type TimelineTag } from "@atlas/shared";
import { requireAuth, type AuthVariables } from "../auth/middleware";
import { deleteItem, insertItem, updateItem } from "./repo";
import { getTimeline } from "./service";

export const timelineRoutes = new Hono<{ Variables: AuthVariables }>();
timelineRoutes.use("*", requireAuth);

export const parseDraft = (value: unknown): TimelineDraft | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  if (typeof draft.title !== "string" || !draft.title.trim()) return null;
  if (typeof draft.startAt !== "string") return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-](\d{2}):(\d{2}))$/.exec(draft.startAt);
  if (!parts) return null;
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = parts;
  const calendar = new Date(0);
  calendar.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() + 1 !== Number(month) || calendar.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59 || Number(offsetHour ?? 0) > 23 || Number(offsetMinute ?? 0) > 59) return null;
  const startMs = Date.parse(draft.startAt);
  if (!Number.isFinite(startMs)) return null;
  if (typeof draft.durationMin !== "number" || !Number.isSafeInteger(draft.durationMin) || draft.durationMin <= 0) return null;
  if (!Number.isFinite(new Date(startMs + draft.durationMin * 60_000).getTime())) return null;
  if (draft.note !== undefined && typeof draft.note !== "string") return null;
  const tag = draft.tag === undefined ? "plan" : draft.tag;
  if (typeof tag !== "string" || !TIMELINE_TAGS.includes(tag as TimelineTag)) return null;
  return {
    title: draft.title.trim(),
    startAt: draft.startAt,
    durationMin: draft.durationMin,
    tag: tag as TimelineTag,
    ...(draft.note === undefined ? {} : { note: draft.note }),
  };
};

timelineRoutes.get("/", async (c) => c.json(await getTimeline(c.get("userId"))));

timelineRoutes.post("/", async (c) => {
  const draft = parseDraft(await c.req.json<unknown>().catch(() => null));
  if (!draft) return c.json({ error: "invalid" }, 400);
  return c.json(await insertItem(c.get("userId"), draft), 201);
});

timelineRoutes.patch("/:id", async (c) => {
  const draft = parseDraft(await c.req.json<unknown>().catch(() => null));
  if (!draft) return c.json({ error: "invalid" }, 400);
  const item = await updateItem(c.get("userId"), c.req.param("id"), draft);
  if (!item) return c.json({ error: "not found" }, 404);
  return c.json(item);
});

timelineRoutes.delete("/:id", async (c) => {
  if (!await deleteItem(c.get("userId"), c.req.param("id"))) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});