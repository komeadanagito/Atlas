import { Hono } from "hono";
import type { TimelineDraft } from "@atlas/shared";
import { clearItems, deleteItem, insertItem, updateItem } from "./repo";
import { getTimeline } from "./service";

export const timelineRoutes = new Hono();

const parseDraft = (draft: TimelineDraft) => {
  if (!draft.title?.trim() || !draft.startAt || !draft.durationMin || draft.durationMin <= 0) return null;
  return {
    ...draft,
    title: draft.title.trim(),
    tag: draft.tag ?? "plan",
  } satisfies TimelineDraft;
};

timelineRoutes.get("/", (c) => c.json(getTimeline()));

timelineRoutes.delete("/", (c) => {
  clearItems();
  return c.json({ ok: true });
});

timelineRoutes.post("/", async (c) => {
  const draft = parseDraft((await c.req.json()) as TimelineDraft);
  if (!draft) return c.json({ error: "invalid" }, 400);
  return c.json(insertItem(draft), 201);
});

timelineRoutes.patch("/:id", async (c) => {
  const draft = parseDraft((await c.req.json()) as TimelineDraft);
  if (!draft) return c.json({ error: "invalid" }, 400);
  const item = updateItem(c.req.param("id"), draft);
  if (!item) return c.json({ error: "not found" }, 404);
  return c.json(item);
});

timelineRoutes.delete("/:id", (c) => {
  if (!deleteItem(c.req.param("id"))) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});