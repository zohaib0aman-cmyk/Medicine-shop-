import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { PageHeader } from "@/components/admin/ui";
import { CouponsClient } from "./CouponsClient";

export const metadata = { title: "Offers & Coupons" };

export default async function CouponsPage() {
  await requirePage("coupons");
  const rows = await sql`
    select id, code, description, type, value, min_order, max_discount, usage_limit, used_count, active,
      to_char(starts_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as starts_at,
      to_char((ends_at at time zone 'Asia/Kolkata') - interval '1 second', 'YYYY-MM-DD') as ends_at,
      case when not active then 'paused'
           when starts_at > now() then 'scheduled'
           when ends_at is not null and ends_at < now() then 'expired'
           when usage_limit is not null and used_count >= usage_limit then 'used up'
           else 'live' end as state,
      (select coalesce(sum(discount), 0) from orders o where o.coupon_code = c.code and o.status <> 'cancelled')::float as given
    from coupons c order by created_at desc`;
  return (
    <>
      <PageHeader eyebrow="Marketing" title="Offers & coupons" subtitle="Customers enter these codes at checkout. Discounts are always recalculated on the server." />
      <CouponsClient rows={JSON.parse(JSON.stringify(rows))} />
    </>
  );
}
