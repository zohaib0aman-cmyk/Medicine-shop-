import { NextResponse } from "next/server";
import { getStaff } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { readFileBytes } from "@/lib/server/storage";
import { canAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Streams a prescription from PRIVATE storage to signed-in staff only.
 * Delivery staff are excluded (they don't need patient medical documents).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getStaff();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  if (me.role === "delivery" || !(canAccess(me.role, "prescriptions") || canAccess(me.role, "orders"))) return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const [rx] = await sql<{ file_path: string; file_type: string }[]>`select file_path, file_type from prescriptions where id = ${id}`;
  if (!rx) return new NextResponse("Not found", { status: 404 });
  const bytes = await readFileBytes("prescriptions", rx.file_path);
  if (!bytes) return new NextResponse("File missing", { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": rx.file_type,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
