import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const HASHED_PASSWORD = bcrypt.hashSync(process.env.AUTH_PASSWORD || 'robin30', 10);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const validUsername = process.env.AUTH_USERNAME || 'robin30';

    if (username !== validUsername || !bcrypt.compareSync(password, HASHED_PASSWORD)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
    );

    const token = await new SignJWT({ username, iat: Date.now() })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const res = NextResponse.json({ ok: true });

    // Set cookie explicitly
    res.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
