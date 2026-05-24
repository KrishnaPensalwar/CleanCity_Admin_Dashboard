import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'http://localhost:8080';

export async function GET(req: Request) {
  const url = `${BACKEND}/api/driver/active`;
  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  headers['referer'] = '/api/driver/active';

  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!text) return NextResponse.json([], { status: res.status });
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json([], { status: res.status });
  }
}
