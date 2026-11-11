"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { text, uuid } from "@/lib/server/validate";

/** Approve / reject — registered pharmacist or owner only (enforced here). */
export async function reviewPrescription(id: string, decision: "approved" | "rejected", reason?: string) {
  return run(async () => {
    const me = await requireStaff("prescriptions", "rx.review");
    const input = z
      .object({ id: uuid, decision: z.enum(["approved", "rejected"]), reason: text(300) })
      .refine((v) => v.decision === "approved" || v.reason.length >= 3, { path: ["reason"], message: "Please give a reason for rejecting." })
      .parse({ id, decision, reason: reason ?? "" });
    const [rx] = await sql<{ customer_name: string; order_number: string | null }[]>`
      update prescriptions p set status = ${input.decision}, reject_reason = ${input.decision === "rejected" ? input.reason : null},
             reviewed_by = ${me.id}, reviewed_at = now()
      where p.id = ${input.id}
      returning p.customer_name, (select number from orders where id = p.order_id) as order_number`;
    if (!rx) throw new UserError("Prescription not found.");
    await logActivity({
      action: `rx.${input.decision === "approved" ? "approve" : "reject"}`,
      entity: "prescription",
      entityId: input.id,
      summary: `${input.decision === "approved" ? "Approved" : "Rejected"} prescription for ${rx.customer_name}${rx.order_number ? ` (${rx.order_number})` : ""}${input.decision === "rejected" ? ` — ${input.reason}` : ""}`,
    });
    return { message: input.decision === "approved" ? "Prescription approved" : "Prescription rejected", revalidate: ["/admin/prescriptions", "/admin/orders", "/admin"] };
  });
}

/** Link (or unlink) a prescription to an order. Only open orders can be linked. */
export async function linkPrescription(id: string, orderId: string | null) {
  return run(async () => {
    await requireStaff("prescriptions");
    const input = z.object({ id: uuid, orderId: uuid.nullable() }).parse({ id, orderId: orderId || null });
    let number: string | null = null;
    if (input.orderId) {
      const [o] = await sql<{ number: string; status: string; customer_id: string | null }[]>`select number, status, customer_id from orders where id = ${input.orderId}`;
      if (!o) throw new UserError("Order not found.");
      if (!["new", "confirmed"].includes(o.status)) throw new UserError("Only new or confirmed orders can be linked.");
      number = o.number;
      await sql`update prescriptions set order_id = ${input.orderId}, customer_id = coalesce(customer_id, ${o.customer_id}) where id = ${input.id}`;
    } else {
      await sql`update prescriptions set order_id = null where id = ${input.id}`;
    }
    await logActivity({ action: "rx.link", entity: "prescription", entityId: input.id, summary: number ? `Linked prescription to ${number}` : "Unlinked prescription from its order" });
    return { message: number ? `Linked to ${number}` : "Unlinked", revalidate: ["/admin/prescriptions", "/admin/orders"] };
  });
}
