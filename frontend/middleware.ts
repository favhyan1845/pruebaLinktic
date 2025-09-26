import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value; // In a real app, you'd get tokens from cookies or headers
  const refreshToken = request.cookies.get('refreshToken')?.value; // For this mock, we're using localStorage, so this won't work directly

  const { pathname } = request.nextUrl;

  // Allow access to login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // If no access token, redirect to login
  // NOTE: In a real app, you'd also check token validity/expiration
  // For this mock, we're simplifying the check.
  // Since localStorage is client-side, this middleware won't have direct access to it.
  // A more robust solution would involve server-side token validation or passing tokens via cookies.
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
