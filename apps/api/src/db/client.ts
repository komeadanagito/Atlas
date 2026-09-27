import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
const envPath = new URL("../../../../.env", import.meta.url);
if (existsSync(envPath)) loadEnvFile(envPath);
import { readFile } from "node:fs/promises";
import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
export const initDb = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
};
export const transaction = async <T>(run: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await run(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
};