"use server";

import { z } from "zod";
import { hashPassword, logActivity, passwordProblem, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { bool, email, formObject, text, uuid } from "@/lib/server/validate";
import { ROLES, ROLE_LABEL } from "@/lib/permissions";

async function assertOwnerRemains(excludingId: string) {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from staff where role = 'owner' and active and id <> ${excludingId}`;
  if (n === 0) throw new UserError("There must always be at least one active Owner.");
}

export async function createStaff(fd: FormData) {
  return run(async () => {
    await requireStaff("staff");
    const v = z.object({ name: text(80, 2), email, role: z.enum(ROLES), password: z.string().max(128) }).parse(formObject(fd));
    const problem = passwordProblem(v.password);
    if (problem) throw new UserError(problem);
    const [s] = await sql<{ id: string }[]>`
      insert into staff (name, email, password_hash, role) values (${v.name}, ${v.email}, ${await hashPassword(v.password)}, ${v.role}) returning id`;
    await logActivity({ action: "staff.create", entity: "staff", entityId: s.id, summary: `Added ${v.name} (${v.email}) as ${ROLE_LABEL[v.role]}` });
    return { message: `${v.name} can now sign in`, revalidate: ["/admin/staff"] };
  });
}

export async function updateStaff(fd: FormData) {
  return run(async () => {
    const me = await requireStaff("staff");
    const v = z.object({ id: uuid, name: text(80, 2), role: z.enum(ROLES), active: bool }).parse(formObject(fd));
    const [cur] = await sql<{ name: string; role: string; active: boolean }[]>`select name, role, active from staff where id = ${v.id}`;
    if (!cur) throw new UserError("Staff member not found.");
    if (v.id === me.id && (v.role !== "owner" || !v.active)) throw new UserError("You can't remove your own Owner access or deactivate yourself.");
    if (cur.role === "owner" && (v.role !== "owner" || !v.active)) await assertOwnerRemains(v.id);
    await sql`update staff set name = ${v.name}, role = ${v.role}, active = ${v.active} where id = ${v.id}`;
    if (!v.active || v.role !== cur.role) await sql`delete from sessions where staff_id = ${v.id}`; // takes effect immediately
    const changes = [cur.role !== v.role && `role ${ROLE_LABEL[cur.role as keyof typeof ROLE_LABEL]} → ${ROLE_LABEL[v.role]}`, cur.active !== v.active && (v.active ? "re-activated" : "deactivated"), cur.name !== v.name && `renamed to ${v.name}`].filter(Boolean);
    await logActivity({ action: "staff.update", entity: "staff", entityId: v.id, summary: `${cur.name}: ${changes.join(", ") || "no changes"}` });
    return { message: "Saved", revalidate: ["/admin/staff"] };
  });
}

export async function resetStaffPassword(id: string, password: string) {
  return run(async () => {
    await requireStaff("staff");
    const v = z.object({ id: uuid, password: z.string().max(128) }).parse({ id, password });
    const problem = passwordProblem(v.password);
    if (problem) throw new UserError(problem);
    const [s] = await sql<{ name: string }[]>`update staff set password_hash = ${await hashPassword(v.password)} where id = ${v.id} returning name`;
    if (!s) throw new UserError("Staff member not found.");
    await sql`delete from sessions where staff_id = ${v.id}`;
    await logActivity({ action: "staff.password", entity: "staff", entityId: v.id, summary: `Reset password for ${s.name} (signed out everywhere)` });
    return { message: `Password reset for ${s.name}` };
  });
}

export async function deleteStaff(id: string) {
  return run(async () => {
    const me = await requireStaff("staff");
    uuid.parse(id);
    if (id === me.id) throw new UserError("You can't delete your own account.");
    const [cur] = await sql<{ role: string }[]>`select role from staff where id = ${id}`;
    if (!cur) throw new UserError("Staff member not found.");
    if (cur.role === "owner") await assertOwnerRemains(id);
    const [s] = await sql<{ name: string; email: string }[]>`delete from staff where id = ${id} returning name, email`;
    await logActivity({ action: "staff.delete", entity: "staff", entityId: id, summary: `Removed ${s.name} (${s.email})` });
    return { message: `Removed ${s.name}`, revalidate: ["/admin/staff"] };
  });
}
