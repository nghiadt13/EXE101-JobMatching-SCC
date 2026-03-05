import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth?.user);
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProtected = pathname.startsWith('/dashboard');

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL(getRoleDashboardPath(request.auth?.user?.role), request.nextUrl),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
