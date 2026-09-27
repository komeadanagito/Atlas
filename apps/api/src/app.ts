import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { authRoutes } from "./modules/auth/routes";
import { timelineRoutes } from "./modules/timeline/routes";

export const app = new Hono();
app.use("/api/*", bodyLimit({ maxSize: 64 * 1024, onError: c => c.json({ error: "请求内容过大" }, 413) }));
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origins = new Set([process.env.APP_ORIGIN || "http://localhost:5173"]);
    if (process.env.NODE_ENV !== "production") origins.add("http://127.0.0.1:5173");
    if (!origins.has(c.req.header("Origin") || "")) return c.json({ error: "请求来源不受信任" }, 403);
  }
  await next();
});
// A global bounded budget is deliberately used until trusted proxy/IP topology is configured.
let budget = { start: Date.now(), count: 0 };
app.use("/api/auth/*", async (c, next) => {
  if (["/api/auth/login", "/api/auth/register"].includes(c.req.path)) {
    if (Date.now() - budget.start > 60_000) budget = { start: Date.now(), count: 0 };
    if (++budget.count > 60) { c.header("Retry-After", "60"); return c.json({ error: "请求过于频繁，请稍后重试" }, 429); }
  }
  await next();
});
app.route("/api/auth", authRoutes);
app.route("/api/timeline", timelineRoutes);
app.get("/api/health", (c) => c.json({ ok: true }));
app.onError((error, c) => {
  console.error("API request failed", error);
  return c.json({ error: "服务暂时不可用，请稍后重试" }, 503);
});