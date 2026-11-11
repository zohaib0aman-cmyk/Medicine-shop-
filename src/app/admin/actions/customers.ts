"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { formObject, phone, text, uuid } from "@/lib/server/validate";
import { normalizePhone } from "@/lib/phone";

export async function saveCustomer(fd: FormData) {
  return run(async () => {
    await requireStaff("customers");
    const v = z
      .object({
        id: uuid,
        name: text(80, 1),
        phone,
        email: z.preprocess((x) => (typeof x === "string" && x.trim() ? x.trim().toLowerCase() : null), z.string().email("Enter a valid email").max(120).nullable()),
        notes: text(2000),
      })
      .parse(formObject(fd));
    const [c] = await sql<{ name: string }[]>`
      update customers set name = ${v.name}, phone = ${normalizePhone(v.phone)}, email = ${v.email}, notes = ${v.notes}
      where id = ${v.id} returning name`;
    if (!c) throw new UserError("Customer not found.");
    await logActivity({ action: "customer.update", entity: "customer", entityId: v.id, summary: `Updated customer ${v.name}` });
    return { message: "Customer saved", revalidate: [`/admin/customers/${v.id}`, "/admin/customers"] };
  });
}

export async function addAddress(fd: FormData) {
  return run(async () => {
    await requireStaff("customers");
    const v = z.object({ customer_id: uuid, label: text(30, 1), line: text(300, 3) }).parse(formObject(fd));
    await sql`insert into addresses (customer_id, label, line) values (${v.customer_id}, ${v.label}, ${v.line})`;
    await logActivity({ action: "customer.address", entity: "customer", entityId: v.customer_id, summary: `Added address “${v.label}”` });
    return { message: "Address added", revalidate: [`/admin/customers/${v.customer_id}`] };
  });
}

export async function deleteAddress(id: string) {
  return run(async () => {
    await requireStaff("customers");
    uuid.parse(id);
    const [a] = await sql<{ customer_id: string; label: string }[]>`delete from addresses where id = ${id} returning customer_id, label`;
    if (!a) throw new UserError("Address not found.");
    await logActivity({ action: "customer.address.delete", entity: "customer", entityId: a.customer_id, summary: `Removed address “${a.label}”` });
    return { message: "Address removed", revalidate: [`/admin/customers/${a.customer_id}`] };
  });
}

export async function deleteCustomer(id: string) {
  return run(async () => {
    await requireStaff("customers", "customers.delete");
    uuid.parse(id);
    // orders keep their own copy of name / phone / address, so history survives
    const [c] = await sql<{ name: string }[]>`delete from customers where id = ${id} returning name`;
    if (!c) throw new UserError("Customer not found.");
    await logActivity({ action: "customer.delete", entity: "customer", entityId: id, summary: `Deleted customer ${c.name}` });
    return { message: `Deleted ${c.name}`, revalidate: ["/admin/customers"] };
  });
}
