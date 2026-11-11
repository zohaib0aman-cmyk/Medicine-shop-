import { requirePage } from "@/lib/server/auth";
import { REPORTS, buildReport, normaliseRange, type ReportType } from "@/lib/server/admin/reports";
import { PageHeader } from "@/components/admin/ui";
import { ReportsClient } from "./ReportsClient";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; from?: string; to?: string }> }) {
  await requirePage("reports");
  const sp = await searchParams;
  const type = (Object.keys(REPORTS).includes(sp.type ?? "") ? sp.type : "sales") as ReportType;
  const { from, to } = normaliseRange(sp.from, sp.to);
  const report = await buildReport(type, from, to);
  return (
    <>
      <PageHeader eyebrow="Insight" title="Reports" subtitle="Pick a report and date range. Export to Excel for your accountant, or PDF to print." />
      <ReportsClient report={JSON.parse(JSON.stringify(report))} type={type} from={from} to={to} />
    </>
  );
}
