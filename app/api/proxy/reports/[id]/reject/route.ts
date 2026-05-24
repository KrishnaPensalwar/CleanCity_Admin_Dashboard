import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'http://localhost:8080';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = `${BACKEND}/api/reports/${id}/reject`;

    const headers: Record<string, string> = {};
    const auth = req.headers.get('authorization');
    if (auth) headers['authorization'] = auth;

    const res = await fetch(url, { method: 'POST', headers });
    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text || '{}'), { status: res.status });
    } catch {
      return NextResponse.json(
        { message: text || 'Failed to reject report' },
        { status: res.status }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to proxy reject request';
    return NextResponse.json({ message }, { status: 500 });
  }
}
