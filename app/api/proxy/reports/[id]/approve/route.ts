import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'http://localhost:8080';

export async function POST(req: Request, { params }: any) {
  const { id } = params;
  const url = `${BACKEND}/api/reports/${id}/approve`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;

  const res = await fetch(url, { method: 'POST', headers });
  const data = await res.text();
  return NextResponse.json({ ok: true, data });
}
