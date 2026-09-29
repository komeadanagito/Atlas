import { serve } from "@hono/node-server";
import { initDb, pool } from "./db/client";
import { app } from "./app";

try {
  if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN?.startsWith("https://")) throw new Error("Production APP_ORIGIN must use HTTPS");
  await initDb();
  const server = serve({ fetch: app.fetch, port: Number(process.env.PORT || 8787) });
  // Close keep-alive sockets and DB sessions promptly so watch restarts don't leak pooler clients.
  const stop = () => {
    setTimeout(() => process.exit(0), 2000).unref();
    server.close();
    (server as { closeAllConnections?: () => void }).closeAllConnections?.();
    void pool.end().finally(() => process.exit(0));
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  console.log("Atlas API ready on port", process.env.PORT || 8787);
} catch (error) {
  console.error("Atlas startup failed", error);
  await pool.end();
  process.exitCode = 1;
}