import { NextRequest, NextResponse } from 'next/server';

// Use internal URL for server-side requests (same machine)
const INTERNAL_API_URL = process.env.INTERNAL_API_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:3456';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[login proxy] connecting to', INTERNAL_API_URL);

    const res = await fetch(`${INTERNAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[login proxy] error:', err);
    return NextResponse.json({ error: 'Could not connect to server.' }, { status: 502 });
  }
}
