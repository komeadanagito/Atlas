import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
const envPath = new URL("../../../../.env", import.meta.url);
if (existsSync(envPath)) loadEnvFile(envPath);
import { readFile } from "node:fs/promises";
import pg from "pg";

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("127.0.0.1") || process.env.DATABASE_URL.includes("localhost");

// A new connection to the remote pooler (TCP + TLS + auth) costs ~1.5s, so keep a few warm
// instead of the pg default of closing every idle client after 10s.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  min: 2,
  idleTimeoutMillis: 5 * 60_000,
  connectionTimeoutMillis: 8000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  options: "-c search_path=atlas,public",
});
// Idle clients killed by the pooler/network emit here; without a listener the process crashes.
pool.on("error", (error) => console.warn("Idle database client dropped:", error.message));

const TRANSIENT_CODES = new Set(["57P01", "57P02", "57P03", "08000", "08001", "08003", "08004", "08006", "53300", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "ENOTFOUND", "EAI_AGAIN"]);
const TRANSIENT_MESSAGE = /timeout|terminated|Connection ended|socket hang up|max clients/i;
export const isTransientDbError = (error: unknown) => {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  return (!!code && TRANSIENT_CODES.has(code)) || TRANSIENT_MESSAGE.test(message ?? "");
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Checks out a client, retrying transient connect failures (nothing has run yet, so retrying is safe). */
const connect = async (attempts = 3): Promise<pg.PoolClient> => {
  for (let attempt = 1; ; attempt++) {
    try { return await pool.connect(); }
    catch (error) {
      if (attempt >= attempts || !isTransientDbError(error)) throw error;
      await wait(250 * attempt);
    }
  }
};

/**
 * Pool query with resilience: connect failures are always retried; a transient failure while
 * running the statement is retried once only for reads, because a write may already have applied.
 */
export const query = async <R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]): Promise<pg.QueryResult<R>> => {
  const isRead = /^\s*(select|with)\b/i.test(text);
  for (let attempt = 1; ; attempt++) {
    const client = await connect();
    try {
      const result = await client.query<R>(text, values);
      client.release();
      return result;
    } catch (error) {
      const transient = isTransientDbError(error);
      client.release(transient ? (error as Error) : undefined); // destroy broken connections
      if (!transient || !isRead || attempt >= 2) throw error;
    }
  }
};

export const initDb = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  await query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
  // Open the second warm connection in the background so the first page load doesn't pay for it.
  void Promise.all([query("SELECT 1"), query("SELECT 1")]).catch(() => {});
};

// Light heartbeat so the pooler/NAT doesn't silently drop idle warm connections.
const heartbeat = setInterval(() => { void query("SELECT 1").catch(() => {}); }, 60_000);
heartbeat.unref();

export const transaction = async <T>(run: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await connect();
  let broken: Error | undefined;
  try {
    await client.query("BEGIN");
    const value = await run(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    if (isTransientDbError(error)) broken = error as Error;
    else await client.query("ROLLBACK").catch((rollbackError: Error) => { broken = rollbackError; });
    throw error;
  } finally { client.release(broken); }
};
