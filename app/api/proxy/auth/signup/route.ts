import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'https://wheat-salvaging-underrate.ngrok-free.dev';

export async function POST(req: Request) {
  const url = `${BACKEND}/auth/signup`;
  const headers: any = { 'Content-Type': 'application/json' };
  const body = await req.text();

  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  try {
    const data = JSON.parse(text || '{}');
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ raw: text }, { status: res.status });
  }
}
