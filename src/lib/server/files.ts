import "server-only";
import { randomUUID } from "node:crypto";

/** Detect the real file type from its first bytes — never trust the browser's MIME type or extension. */
export function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export async function readUpload(file: unknown, opts: { maxBytes: number; allowPdf: boolean }) {
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a file." } as const;
  if (file.size > opts.maxBytes) return { error: `File is too large (max ${Math.round(opts.maxBytes / 1024 / 1024)} MB).` } as const;
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || (type.mime === "application/pdf" && !opts.allowPdf)) {
    return { error: opts.allowPdf ? "Only JPG, PNG, WebP or PDF files are allowed." : "Only JPG, PNG or WebP images are allowed." } as const;
  }
  const d = new Date();
  const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${randomUUID()}.${type.ext}`;
  return { buf, key, ...type, size: file.size } as const;
}
