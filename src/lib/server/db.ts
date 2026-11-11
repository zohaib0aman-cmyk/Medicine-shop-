import "server-only";
import postgres from "postgres";

/**
 * Postgres connection (Supabase or any Postgres 15+).
 * Use the Supabase *connection string* (Project → Settings → Database).
 * With the transaction pooler (port 6543) prepared statements must be off.
 */
type Sql = postgres.Sql<Record<string, never>>;
const g = globalThis as unknown as { __adpSql?: Sql };

export const hasDb = () => !!process.env.DATABASE_URL;

function client(): Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set — see README › Admin setup.");
  if (!g.__adpSql) {
    g.__adpSql = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      prepare: false,
      ssl: process.env.DATABASE_SSL === "disable" || /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : "require",
      transform: { undefined: null },
      types: {
        // return numeric columns as JS numbers (money values are numeric(10,2))
        numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
        // bigint counts → number (all counts here are far below 2^53)
        bigint: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      },
    }) as unknown as Sql;
  }
  return g.__adpSql;
}

/** Lazily-connected tagged-template SQL client. Always parameterised — never interpolate strings. */
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
  apply: (_t, _this, args) => (client() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_t, prop) => {
    const c = client() as unknown as Record<string | symbol, unknown>;
    const v = c[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
});
