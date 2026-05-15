import { NextResponse } from "next/server";
import { reports, drivers } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    drivers: drivers.length,
  });
}
