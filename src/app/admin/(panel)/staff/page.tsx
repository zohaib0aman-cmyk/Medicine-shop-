import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { PageHeader } from "@/components/admin/ui";
import { StaffClient } from "./StaffClient";

export const metadata = { title: "Staff & Roles" };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ tab?: string; who?: string; entity?: string; page?: string }> }) {
  const me = await requirePage("staff");
  const sp = await searchParams;
  const staff = await sql`
    select s.id, s.name, s.email, s.role, s.active, s.created_at, s.last_login_at,
      (select count(*) from sessions x where x.staff_id = s.id and x.expires_at > now())::int as sessions
    from staff s order by s.active desc, s.role, s.name`;
  const page = Math.max(1, Number(sp.page) || 1);
  const who = /^[0-9a-f-]{36}$/i.test(sp.who ?? "") ? sp.who! : null;
  const entity = /^[a-z]{2,20}$/.test(sp.entity ?? "") ? sp.entity! : null;
  const where = sql`where true ${who ? sql`and staff_id = ${who}` : sql``} ${entity ? sql`and entity = ${entity}` : sql``}`;
  const log = await sql`
    select id, staff_name, action, entity, entity_id, summary, ip, created_at from activity_log ${where}
    order by created_at desc limit 50 offset ${(page - 1) * 50}`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from activity_log ${where}`;
  const entities = await sql<{ entity: string }[]>`select distinct entity from activity_log order by entity`;
  return (
    <>
      <PageHeader eyebrow="Owner" title="Staff & roles" subtitle="Each role only sees the modules it needs. Every change anyone makes is recorded in the activity log." />
      <StaffClient
        me={me.id}
        staff={JSON.parse(JSON.stringify(staff))}
        log={JSON.parse(JSON.stringify(log))}
        logMeta={{ page, pages: Math.max(1, Math.ceil(total / 50)), total, who, entity, entities: entities.map((e) => e.entity) }}
        tab={sp.tab === "activity" ? "activity" : sp.tab === "roles" ? "roles" : "team"}
      />
    </>
  );
}
