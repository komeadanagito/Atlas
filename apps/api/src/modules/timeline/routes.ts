import { Hono } from "hono";
import type { TimelineDraft } from "@atlas/shared";
import { clearItems, insertItem } from "./repo";
import { getTimeline } from "./service";

export const timelineRoutes = new Hono();

timelineRoutes.get("/", (c) => c.json(getTimeline()));

timelineRoutes.delete("/", (c) => {
  clearItems();
  return c.json({ ok: true });
});

timelineRoutes.post("/", async (c) => {
  const draft = (await c.req.json()) as TimelineDraft;
  if (!draft.title || !draft.startAt) return c.json({ error: "invalid" }, 400);
  return c.json(insertItem(draft), 201);
});