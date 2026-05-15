import { NextResponse } from "next/server";

let drivers = [
  { id: 1, name: "Arjun Kumar", status: "active" },
  { id: 2, name: "Suresh Rao", status: "idle" },
];

export async function GET() {
  return NextResponse.json(drivers);
}

export async function POST(req: Request) {
  const body = await req.json();

  const newDriver = {
    id: Date.now(),
    name: body.name,
    status: "idle",
  };

  drivers.push(newDriver);

  return NextResponse.json(newDriver);
}