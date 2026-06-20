import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'https://wheat-salvaging-underrate.ngrok-free.dev';

export async function POST(req: Request) {
  const url = `${BACKEND}/auth/login`;
  const headers: any = { 'Content-Type': 'application/json' };
  const body = await req.text();

  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  if (!text) return NextResponse.json({}, { status: res.status });
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch (_err) {
    return NextResponse.json({ token: text }, { status: res.status });
  }
}
