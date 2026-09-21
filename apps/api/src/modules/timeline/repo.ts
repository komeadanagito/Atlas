import { randomUUID } from "node:crypto";
import type { TimelineDraft, TimelineItem, TimelineTag } from "@atlas/shared";
import { db } from "../../db/client";

type Row = {
  id: string;
  start_at: string;
  duration_min: number;
  title: string;
  note: string | null;
  tag: string;
};

const toItem = (row: Row): TimelineItem => ({
  id: row.id,
  startAt: row.start_at,
  durationMin: row.duration_min,
  title: row.title,
  note: row.note ?? undefined,
  tag: row.tag as TimelineTag,
});

export const listItems = (): TimelineItem[] => {
  const rows = db
    .prepare("SELECT id, start_at, duration_min, title, note, tag FROM timeline_items ORDER BY start_at")
    .all() as Row[];
  return rows.map(toItem);
};

export const insertItem = (draft: TimelineDraft): TimelineItem => {
  const item: TimelineItem = { id: randomUUID(), ...draft };
  db.prepare(
    "INSERT INTO timeline_items (id, start_at, duration_min, title, note, tag) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(item.id, item.startAt, item.durationMin, item.title, item.note ?? null, item.tag);
  return item;
};

export const clearItems = () => {
  db.exec("DELETE FROM timeline_items");
};