import { NextResponse } from "next/server";
import { reports } from "@/lib/db";

export async function GET() {
  return NextResponse.json(reports);
}

export async function PATCH(req: Request) {
  const { id, action } = await req.json();

  reports.forEach((r) => {
    if (r.id === id) r.status = action;
  });

  return NextResponse.json({ success: true });
}