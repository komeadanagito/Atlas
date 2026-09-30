import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});
try {
  await client.connect();
  const { rows } = await client.query(
    "select current_user as user, current_database() as db, now() as server_time",
  );
  const { rows: tables } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  console.log("CONNECTED:", JSON.stringify(rows[0]));
  console.log("TABLES:", tables.map((t) => t.table_name).join(", ") || "(none yet)");
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}