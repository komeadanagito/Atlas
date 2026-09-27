import { randomUUID } from "node:crypto";
import type { TimelineDraft, TimelineItem } from "@atlas/shared";
import { pool } from "../../db/client";
type Row = { id: string; start_at: Date; duration_min: number; title: string; note: string | null; tag: TimelineItem['tag'] };
const toItem = (row: Row): TimelineItem => ({ id: row.id, startAt: row.start_at.toISOString(), durationMin: row.duration_min, title: row.title, note: row.note ?? undefined, tag: row.tag });
export const listItems = async (userId: string) => {
  const { rows } = await pool.query<Row>("SELECT * FROM timeline_items WHERE user_id=$1 ORDER BY start_at", [userId]);
  return rows.map(toItem);
};
export const insertItem = async (userId: string, draft: TimelineDraft) => {
  const { rows } = await pool.query<Row>("INSERT INTO timeline_items(id,user_id,start_at,duration_min,title,note,tag) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *", [randomUUID(), userId, draft.startAt, draft.durationMin, draft.title, draft.note ?? null, draft.tag]);
  return toItem(rows[0]);
};
export const updateItem = async (userId: string, id: string, draft: TimelineDraft) => {
  const { rows } = await pool.query<Row>("UPDATE timeline_items SET start_at=$1,duration_min=$2,title=$3,note=$4,tag=$5 WHERE id::text=$6 AND user_id=$7 RETURNING *", [draft.startAt, draft.durationMin, draft.title, draft.note ?? null, draft.tag, id, userId]);
  return rows[0] ? toItem(rows[0]) : null;
};
export const deleteItem = async (userId: string, id: string) => {
  const { rowCount } = await pool.query("DELETE FROM timeline_items WHERE id::text=$1 AND user_id=$2", [id,userId]);
  return !!rowCount;
};