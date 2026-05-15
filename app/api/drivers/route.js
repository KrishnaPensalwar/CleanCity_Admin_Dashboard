import { drivers } from "@/lib/db";

export function GET() {
  return new Response(JSON.stringify(drivers), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req) {
  const body = await req.json();

  if (!body.name || !body.email) {
    return new Response(JSON.stringify({ error: 'name and email are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const newDriver = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    status: "idle",
  };

  drivers.push(newDriver);

  return new Response(JSON.stringify(newDriver), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
