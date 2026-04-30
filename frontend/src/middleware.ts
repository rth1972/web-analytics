import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/verify-email',
];

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
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

    // Inject user info into request headers for server components
    const headers = new Headers(req.headers);
    headers.set('x-user-id',    payload.userId as string);
    headers.set('x-user-email', payload.email as string);
    headers.set('x-user-role',  payload.role as string);

    // Protect admin routes
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
