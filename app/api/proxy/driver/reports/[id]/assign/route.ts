import { NextResponse } from 'next/server';

const BACKEND = process.env.CC_BACKEND || 'http://localhost:8080';

export async function POST(req: Request, { params }: any) {
  try {
    const { id } = await params;
    const url = `${BACKEND}/api/driver/reports/${id}/assign`;

    const auth = req.headers.get('authorization');

    const body = await req.json();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth && { Authorization: auth }),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text), {
        status: res.status,
      });
    } catch {
      return NextResponse.json(
        { raw: text },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || 'Failed to proxy assignment',
      },
      { status: 500 }
    );
  }
}


