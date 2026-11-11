import "server-only";
import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
}
export async function userAgent() {
  return ((await headers()).get("user-agent") ?? "").slice(0, 200);
}
