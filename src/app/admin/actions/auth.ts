"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, login, logActivity, logout, passwordProblem, requireStaff, verifyPassword } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { formObject } from "@/lib/server/validate";

export async function loginAction(_prev: unknown, fd: FormData) {
  const input = z.object({ email: z.string().max(120), password: z.string().min(1).max(200) }).safeParse(formObject(fd));
  if (!input.success) return { error: "Enter your email and password.", email: "" };
  const r = await login(input.data.email, input.data.password);
  if (!r.ok) return { error: r.error, locked: r.locked, email: input.data.email.slice(0, 120) };
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  try {
    await logActivity({ action: "logout", entity: "staff", summary: "Signed out" });
  } catch {}
  await logout();
  redirect("/admin/login");
}

export async function changeOwnPassword(fd: FormData) {
  return run(async () => {
    const me = await requireStaff();
    const { current, next } = z.object({ current: z.string().min(1, "Required").max(200), next: z.string().max(200) }).parse(formObject(fd));
    const problem = passwordProblem(next);
    if (problem) throw new UserError(problem);
    const [row] = await sql<{ password_hash: string }[]>`select password_hash from staff where id = ${me.id}`;
    if (!(await verifyPassword(current, row.password_hash))) throw new UserError("Your current password is incorrect.");
    await sql`update staff set password_hash = ${await hashPassword(next)} where id = ${me.id}`;
    await sql`delete from sessions where staff_id = ${me.id} and id <> ${me.sessionId}`;
    await logActivity({ action: "password.change", entity: "staff", entityId: me.id, summary: "Changed own password" });
    return { message: "Password updated." };
  });
}
