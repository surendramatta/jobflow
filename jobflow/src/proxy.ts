import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // For MVP: simple demo auth via header
  // In production, use NextAuth session validation
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublic = request.nextUrl.pathname === '/' || isAuthPage || isApiAuth;

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth - in production this would verify JWT/session
  // For demo, we allow through but the API uses x-user-id header
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.png$).*)'],
};
