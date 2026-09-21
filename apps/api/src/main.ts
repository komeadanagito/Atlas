import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { timelineRoutes } from "./modules/timeline/routes";

const app = new Hono();
app.use("*", cors());
app.route("/api/timeline", timelineRoutes);
app.get("/api/health", (c) => c.json({ ok: true }));

const port = 8787;
serve({ fetch: app.fetch, port });
console.log(`atlas api http://127.0.0.1:${port}`);