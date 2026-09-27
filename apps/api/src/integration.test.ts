import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

const url = process.env.TEST_DATABASE_URL;
const run = url ? it : it.skip;
let db: typeof import("./db/client");
let auth: typeof import("./modules/auth/repo");
let timeline: typeof import("./modules/timeline/repo");
const ids: string[] = [];
beforeAll(async () => {
  if (!url) return;
  if (url === process.env.DATABASE_URL || !new URL(url).pathname.endsWith("_test")) throw new Error("Use a separate database ending in _test");
  process.env.DATABASE_URL = url;
  db = await import("./db/client"); await db.initDb();
  auth = await import("./modules/auth/repo"); timeline = await import("./modules/timeline/repo");
});
afterAll(async () => {
  if (!db) return;
  await db.pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
  await db.pool.end();
});
run("real PG isolates users and revokes all sessions after password change", async () => {
  const { hashPassword } = await import("./modules/auth/crypto");
  const suffix = randomUUID().slice(0,8);
  const a = await auth.createUser(`a_${suffix}`, hashPassword("secret123")); ids.push(a.id);
  const b = await auth.createUser(`b_${suffix}`, hashPassword("secret123")); ids.push(b.id);
  const token = await auth.createSession(a.id);
  const token2 = await auth.createSession(a.id);
  expect(token).toBeTruthy(); expect((await auth.findUserByToken(token!))?.id).toBe(a.id);
  const draft = {title:"isolated",startAt:new Date().toISOString(),durationMin:30,tag:"plan" as const};
  const item = await timeline.insertItem(a.id,draft);
  expect(await timeline.listItems(b.id)).toEqual([]);
  expect(await timeline.updateItem(b.id,item.id,draft)).toBeNull();
  expect(await timeline.deleteItem(b.id,item.id)).toBe(false);
  expect(await timeline.updateItem(a.id,item.id,{...draft,title:"updated"})).toMatchObject({title:"updated"});
  expect(await auth.changePassword(a.id,"incorrect","secret456")).toBe(false);
  expect(await auth.changePassword(a.id,"secret123","secret456")).toBe(true);
  expect(await auth.findUserByToken(token!)).toBeNull(); expect(await auth.findUserByToken(token2!)).toBeNull();
  expect(await timeline.deleteItem(a.id,item.id)).toBe(true);
});