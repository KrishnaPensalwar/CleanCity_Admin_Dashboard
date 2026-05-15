import ReportTable from "@/components/ReportTable";
import { drivers as dbDrivers } from "@/lib/db";

async function getReports() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/proxy/reports`, { cache: "no-store" });
  return res.json();
}

export default async function ReportsPage() {
  const reports = await getReports();

  // enrich reports with driver info from in-memory db
  const enriched = reports.map((r: any) => {
    const driver = dbDrivers.find((d) => d.id === r.driverId) || null;
    return { ...r, driver };
  });

  return (
    <>
      <h1 className="page-title">Reports</h1>
      <ReportTable reports={enriched} />
    </>
  );
}