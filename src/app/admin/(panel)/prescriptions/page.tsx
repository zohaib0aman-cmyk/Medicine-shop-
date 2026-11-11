import { requirePage } from "@/lib/server/auth";
import { listPrescriptions } from "@/lib/server/admin/prescriptions";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { RxQueue } from "./RxQueue";

export const metadata = { title: "Prescriptions" };

export default async function PrescriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string; open?: string }> }) {
  const me = await requirePage("prescriptions");
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const data = await listPrescriptions(status);
  return (
    <>
      <PageHeader
        eyebrow="Pharmacist"
        title="Prescriptions"
        subtitle="Uploaded prescriptions are stored privately and only visible to signed-in staff. Orders with Rx items stay locked until a linked prescription is approved."
      />
      <RxQueue data={JSON.parse(JSON.stringify(data))} status={status} canReview={can(me.role, "rx.review")} openId={sp.open} />
    </>
  );
}
