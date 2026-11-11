import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * File storage.
 *  • Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
 *    ("prescriptions" bucket is PRIVATE, "product-images" is public).
 *  • Otherwise a local folder outside /public (.data/storage) for development.
 * The service-role key is only ever used on the server.
 */
export type Bucket = "prescriptions" | "product-images";

const g = globalThis as unknown as { __adpSupa?: SupabaseClient };
const useSupabase = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
function supa() {
  if (!g.__adpSupa) {
    g.__adpSupa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return g.__adpSupa;
}

const LOCAL_ROOT = path.join(process.cwd(), ".data", "storage");
function localPath(bucket: Bucket, key: string) {
  const p = path.join(LOCAL_ROOT, bucket, key);
  if (!p.startsWith(path.join(LOCAL_ROOT, bucket) + path.sep)) throw new Error("Invalid storage key");
  return p;
}

export async function putFile(bucket: Bucket, key: string, data: Buffer, contentType: string) {
  if (useSupabase()) {
    const { error } = await supa().storage.from(bucket).upload(key, data, { contentType, upsert: false });
    if (error) throw new Error("Upload failed: " + error.message);
    return key;
  }
  const p = localPath(bucket, key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
  return key;
}

export async function deleteFile(bucket: Bucket, key: string) {
  if (!key) return;
  if (useSupabase()) {
    await supa().storage.from(bucket).remove([key]);
    return;
  }
  await unlink(localPath(bucket, key)).catch(() => {});
}

/** Read a file (used to stream private prescriptions to signed-in staff). */
export async function readFileBytes(bucket: Bucket, key: string): Promise<Buffer | null> {
  if (useSupabase()) {
    const { data, error } = await supa().storage.from(bucket).download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  return readFile(localPath(bucket, key)).catch(() => null);
}

/** Public URL for product images. */
export function publicImageUrl(key: string) {
  if (!key) return "";
  if (/^https?:\/\//.test(key) || key.startsWith("/")) return key;
  if (process.env.SUPABASE_URL) return `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${key}`;
  return `/media/product-images/${key}`;
}
