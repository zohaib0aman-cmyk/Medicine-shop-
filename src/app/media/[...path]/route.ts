import { NextResponse } from "next/server";
import { readFileBytes } from "@/lib/server/storage";
import { sniff } from "@/lib/server/files";

/**
 * Serves PUBLIC product images when running with local storage (no Supabase).
 * Only the product-images bucket is reachable here — prescriptions are never served from this route.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [bucket, ...rest] = path;
  const key = rest.join("/");
  if (bucket !== "product-images" || !/^[\w/-]+\.(jpg|png|webp)$/.test(key) || key.includes("..")) return new NextResponse("Not found", { status: 404 });
  const bytes = await readFileBytes("product-images", key);
  if (!bytes) return new NextResponse("Not found", { status: 404 });
  const type = sniff(bytes);
  if (!type || type.mime === "application/pdf") return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": type.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
