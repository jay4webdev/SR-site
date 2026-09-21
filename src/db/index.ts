import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// DATABASE_URL is the app's canonical variable. POSTGRES_URL is accepted so
// Vercel Marketplace / Neon integrations work without a code change.
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Keep each serverless instance conservative with database connections.
// Hosted Postgres URLs (Neon, Supabase, Vercel Marketplace providers) should
// include `sslmode=require`; node-postgres reads that from the connection URL.
export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DATABASE_POOL_MAX || 3),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
