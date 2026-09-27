import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { findUserByToken } from "./repo";
import { SESSION_TTL_MS } from "./crypto";
export type AuthVariables = { userId: string };
export const sessionToken = (c: Context) => getCookie(c, "atlas_session");
export const sessionCookie = (c: Context, token: string, clear = false) => setCookie(c, "atlas_session", token, {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/", maxAge: clear ? 0 : SESSION_TTL_MS / 1000,
});
export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const token = sessionToken(c);
  const user = token ? await findUserByToken(token) : null;
  if (!user) return c.json({ error: "登录已失效，请重新登录" }, 401);
  c.set("userId", user.id);
  await next();
};