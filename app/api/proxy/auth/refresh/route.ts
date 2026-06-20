import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'https://wheat-salvaging-underrate.ngrok-free.dev';

export async function POST(req: Request) {
  const url = `${BACKEND}/auth/refresh`;
  const headers: any = { 'Content-Type': 'application/json' };
  const body = await req.text();

  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
