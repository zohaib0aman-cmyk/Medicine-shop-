import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export class UserError extends Error {}

/** Wraps a server action: maps validation / auth / DB errors to friendly messages, never leaks internals. */
export async function run<T>(fn: () => Promise<{ message?: string; data?: T; revalidate?: string[]; storefront?: boolean }>): Promise<ActionResult<T>> {
  try {
    const r = await fn();
    for (const p of r.revalidate ?? []) revalidatePath(p);
    if (r.storefront) revalidateTag("storefront");
    return { ok: true, message: r.message, data: r.data };
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const i of e.issues) fieldErrors[i.path.join(".")] ??= i.message;
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }
    if (e instanceof AuthError || e instanceof UserError) return { ok: false, error: e.message };
    const pg = e as { code?: string; constraint_name?: string; detail?: string };
    if (pg.code === "23505") return { ok: false, error: "That already exists (duplicate " + (pg.constraint_name?.replace(/_key$/, "").split("_").slice(1).join(" ") || "value") + ")." };
    if (pg.code === "23503") return { ok: false, error: "This is still in use by other records, so it can't be removed." };
    if (pg.code === "23514") return { ok: false, error: "A value is out of the allowed range" + (pg.constraint_name === "price_not_above_mrp" ? ": selling price can't exceed MRP." : ".") };
    console.error("[admin action]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
