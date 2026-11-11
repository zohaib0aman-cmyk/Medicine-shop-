"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { text, uuid } from "@/lib/server/validate";

export async function setReviewStatus(id: string, status: "approved" | "hidden" | "pending") {
  return run(async () => {
    await requireStaff("reviews");
    const v = z.object({ id: uuid, status: z.enum(["approved", "hidden", "pending"]) }).parse({ id, status });
    const [r] = await sql<{ name: string }[]>`update reviews set status = ${v.status} where id = ${v.id} returning name`;
    if (!r) throw new UserError("Review not found.");
    await logActivity({ action: `review.${v.status}`, entity: "review", entityId: v.id, summary: `Review by ${r.name} → ${v.status}` });
    return { message: v.status === "approved" ? "Review is now live" : v.status === "hidden" ? "Review hidden" : "Moved back to pending", revalidate: ["/admin/reviews"], storefront: true };
  });
}

export async function replyReview(id: string, reply: string) {
  return run(async () => {
    const me = await requireStaff("reviews");
    const v = z.object({ id: uuid, reply: text(1000) }).parse({ id, reply });
    const [r] = await sql<{ name: string }[]>`
      update reviews set reply = ${v.reply || null}, replied_by = ${v.reply ? me.id : null}, replied_at = ${v.reply ? sql`now()` : null}
      where id = ${v.id} returning name`;
    if (!r) throw new UserError("Review not found.");
    await logActivity({ action: "review.reply", entity: "review", entityId: v.id, summary: v.reply ? `Replied to ${r.name}` : `Removed reply to ${r.name}` });
    return { message: v.reply ? "Reply published" : "Reply removed", revalidate: ["/admin/reviews"], storefront: true };
  });
}

export async function deleteReview(id: string) {
  return run(async () => {
    await requireStaff("reviews");
    uuid.parse(id);
    const [r] = await sql<{ name: string }[]>`delete from reviews where id = ${id} returning name`;
    if (!r) throw new UserError("Review not found.");
    await logActivity({ action: "review.delete", entity: "review", entityId: id, summary: `Deleted review by ${r.name}` });
    return { message: "Review deleted", revalidate: ["/admin/reviews"], storefront: true };
  });
}
