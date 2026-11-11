/** @type {import('next').NextConfig} */
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["exceljs", "jspdf", "jspdf-autotable", "postgres"],
  experimental: {
    // prescription uploads (5 MB) and product images (3 MB × up to 6) go through server actions
    serverActions: { bodySizeLimit: "20mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
};
export default nextConfig;
