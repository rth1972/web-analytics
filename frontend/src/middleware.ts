import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Exact matches — only these specific paths are public
const PUBLIC_EXACT = ['/', '/login', '/register'];

// Prefix matches — anything starting with these is public
const PUBLIC_PREFIXES = [
  '/verify-email',
  '/public/',
  '/privacy',
  '/api/auth/login',
  '/api/auth/logout',
];

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check exact public paths
  if (PUBLIC_EXACT.includes(pathname)) {
    return NextResponse.next();
  }

  // Check prefix public paths
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get('auth-token')?.value ||
    req.cookies.get('__Secure-auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    const headers = new Headers(req.headers);
    headers.set('x-user-id',    String(payload.userId   ?? ''));
    headers.set('x-user-email', String(payload.email    ?? ''));
    headers.set('x-user-role',  String(payload.role     ?? ''));

    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next({ request: { headers } });
  } catch {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)'],
};
