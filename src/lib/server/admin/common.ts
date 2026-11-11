import "server-only";
import { sql } from "../db";

export const TZ = process.env.SHOP_TZ || "Asia/Kolkata";

/** Stock = sum of unexpired batch quantities. */
export const stockExpr = (alias = "p") =>
  sql`coalesce((select sum(quantity) from batches b where b.product_id = ${sql(alias)}.id and b.expiry_date > current_date), 0)::int`;

export const EXPIRY_WINDOWS = [30, 60, 90] as const;
