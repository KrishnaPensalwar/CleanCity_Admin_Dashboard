import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'https://wheat-salvaging-underrate.ngrok-free.dev';

export async function GET(req: Request) {
  const url = `${BACKEND}/api/driver/all`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  headers['referer'] = '/api/driver/all';

  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!text) return NextResponse.json([]);
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([]);
  }
}
