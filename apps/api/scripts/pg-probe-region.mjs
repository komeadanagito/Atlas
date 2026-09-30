import pg from "pg";

const ref = "rdposbovgljionbhcrtn";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD first");
  process.exit(1);
}
const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
];

const probe = async (region) => {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
  });
  try {
    await client.connect();
    const { rows } = await client.query("select current_database() as db");
    await client.end();
    return `${region}: OK (db=${rows[0].db}) -> postgresql://postgres.${ref}:<password>@${host}:5432/postgres`;
  } catch (error) {
    const msg = String(error.message);
    if (msg.includes("Tenant or user not found")) return `${region}: wrong region`;
    if (msg.includes("password authentication failed")) return `${region}: RIGHT REGION but password rejected`;
    return `${region}: ${msg.slice(0, 80)}`;
  }
};

const results = await Promise.all(regions.map(probe));
console.log(results.join("\n"));