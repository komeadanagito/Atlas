import { createHash, randomUUID } from "node:crypto";
import type { User } from "@atlas/shared";
import { query, transaction } from "../../db/client";
import { generateToken, SESSION_TTL_MS, verifyPassword, hashPassword } from "./crypto";

type Row = { id: string; username: string; password_hash: string; created_at: Date };
const toUser = (row: Row): User => ({ id: row.id, username: row.username, createdAt: row.created_at.toISOString() });
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export const findUserByUsername = async (username: string) => {
  const { rows } = await query<Row>("SELECT * FROM users WHERE lower(username) = lower($1)", [username]);
  return rows[0] ? { ...toUser(rows[0]), passwordHash: rows[0].password_hash } : null;
};
export const createUser = async (username: string, passwordHash: string) => {
  const { rows } = await query<Row>("INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3) RETURNING *", [randomUUID(), username, passwordHash]);
  return toUser(rows[0]);
};
export const createSession = async (userId: string, expectedHash?: string) => transaction(async (client) => {
  const { rows } = await client.query<Row>("SELECT * FROM users WHERE id=$1 FOR UPDATE", [userId]);
  if (!rows[0] || (expectedHash && rows[0].password_hash !== expectedHash)) return null;
  const token = generateToken();
  await client.query("DELETE FROM sessions WHERE expires_at <= now()");
  await client.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", [digest(token), userId, new Date(Date.now() + SESSION_TTL_MS)]);
  return token;
});
export const findUserByToken = async (token: string) => {
  const { rows } = await query<Row>("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()", [digest(token)]);
  return rows[0] ? toUser(rows[0]) : null;
};
export const deleteSession = async (token: string) => { await query("DELETE FROM sessions WHERE token_hash=$1", [digest(token)]); };
export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => transaction(async (client) => {
  const { rows } = await client.query<Row>("SELECT * FROM users WHERE id=$1 FOR UPDATE", [userId]);
  if (!rows[0] || !verifyPassword(currentPassword, rows[0].password_hash)) return false;
  await client.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hashPassword(newPassword), userId]);
  await client.query("DELETE FROM sessions WHERE user_id=$1", [userId]);
  return true;
});