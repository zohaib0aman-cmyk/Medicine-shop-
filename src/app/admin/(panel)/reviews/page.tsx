import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { PageHeader } from "@/components/admin/ui";
import { ReviewsClient } from "./ReviewsClient";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePage("reviews");
  const { status = "pending" } = await searchParams;
  const s = ["pending", "approved", "hidden"].includes(status) ? status : "pending";
  const rows = await sql`
    select r.id, r.name, r.rating, r.text, r.source, r.status, r.reply, r.created_at, r.replied_at, s.name as replier
    from reviews r left join staff s on s.id = r.replied_by where r.status = ${s} order by r.created_at desc limit 200`;
  const counts = await sql<{ status: string; n: number }[]>`select status, count(*)::int as n from reviews group by status`;
  const [avg] = await sql<{ avg: number | null; n: number }[]>`select avg(rating)::float as avg, count(*)::int as n from reviews where status = 'approved'`;
  return (
    <>
      <PageHeader eyebrow="Reputation" title="Reviews" subtitle={avg.n ? `${avg.avg!.toFixed(1)} ★ average across ${avg.n} published review${avg.n === 1 ? "" : "s"}. Only approved reviews appear on the website.` : "Reviews submitted on the website wait here until you approve them."} />
      <ReviewsClient rows={JSON.parse(JSON.stringify(rows))} status={s} counts={Object.fromEntries(counts.map((c) => [c.status, c.n]))} />
    </>
  );
}
