import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'https://wheat-salvaging-underrate.ngrok-free.dev';

export async function GET(req: Request) {
  const url = `${BACKEND}/api/reports`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  // ensure backend sees the expected referer path (some backends validate this)
  headers['referer'] = '/api/reports';

  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!text) return NextResponse.json([]);
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    // fallback: return raw text inside an array if it's newline separated, otherwise empty
    try {
      return NextResponse.json(JSON.parse(text.trim() || '[]'));
    } catch {
      return NextResponse.json([]);
    }
  }
}
