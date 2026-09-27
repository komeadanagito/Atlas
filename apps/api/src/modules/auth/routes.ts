import { Hono } from "hono";
import { hashPassword, verifyPassword } from "./crypto";
import { requireAuth, sessionCookie, sessionToken, type AuthVariables } from "./middleware";
import { createSession, createUser, deleteSession, findUserByToken, findUserByUsername, changePassword } from "./repo";

export const authRoutes = new Hono<{ Variables: AuthVariables }>();
const passwordValid = (value: unknown): value is string => typeof value === "string" && value.length >= 8 && value.length <= 128;
for (const action of ["register", "login"] as const) {
  authRoutes.post(`/${action}`, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") return c.json({ error: "无效的请求格式" }, 400);
    const username = typeof body.username === "string" ? body.username.trim().normalize("NFKC") : "";
    if (username.length < 2 || username.length > 30 || !/^[\p{L}\p{N}_-]+$/u.test(username) || !passwordValid(body.password)) {
      return c.json({ error: "用户名需为 2–30 位字母、数字、中文或 _ -，密码需为 8–128 位" }, 400);
    }
    const existing = await findUserByUsername(username);
    if (action === "login") {
      if (!existing || !verifyPassword(body.password, existing.passwordHash)) return c.json({ error: "用户名或密码错误" }, 401);
      const token = await createSession(existing.id, existing.passwordHash);
      if (!token) return c.json({ error: "凭据已变更，请重新登录" }, 401);
      sessionCookie(c, token);
      const { passwordHash: _, ...user } = existing;
      return c.json({ user });
    }
    if (existing) return c.json({ error: "用户名已存在" }, 409);
    try {
      const passwordHash = hashPassword(body.password);
      const user = await createUser(username, passwordHash);
      const token = await createSession(user.id, passwordHash);
      if (!token) return c.json({ error: "账户已创建，请重新登录" }, 409);
      sessionCookie(c, token);
      return c.json({ user }, 201);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return c.json({ error: "用户名已存在" }, 409);
      throw error;
    }
  });
}
authRoutes.get("/me", async (c) => {
  const token = sessionToken(c);
  const user = token ? await findUserByToken(token) : null;
  return user ? c.json({ user }) : c.json({ error: "未登录" }, 401);
});
authRoutes.post("/logout", async (c) => {
  const token = sessionToken(c);
  if (token) await deleteSession(token);
  sessionCookie(c, "", true);
  return c.json({ ok: true });
});
authRoutes.post("/change-password", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !passwordValid(body.currentPassword) || !passwordValid(body.newPassword)) return c.json({ error: "密码需为 8–128 位" }, 400);
  if (body.currentPassword === body.newPassword) return c.json({ error: "新密码不能与原密码相同" }, 400);
  if (!await changePassword(c.get("userId"), body.currentPassword, body.newPassword)) return c.json({ error: "原密码错误" }, 400);
  sessionCookie(c, "", true);
  return c.json({ ok: true });
});