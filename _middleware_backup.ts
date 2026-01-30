import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('auth')?.value;
  const path = request.nextUrl.pathname;

  // 1. Define Paths
  const isAdminPath = path.startsWith('/admin');
  const isOfficialPath = path.startsWith('/trackside');
  const isLineupPath = path.startsWith('/lineup');
  const isAnnouncerPath = path.startsWith('/announcer');
  const isRegPath = path.startsWith('/registration');

  // 2. Check Permissions
  // If trying to access a protected area, check if the specific role matches
  
  // ADMIN (Requires 'admin')
  if (isAdminPath && auth !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // OFFICIAL (Requires 'official' OR 'admin')
  if (isOfficialPath && auth !== 'official' && auth !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // LINEUP (Requires 'lineup' OR 'admin' OR 'official')
  if (isLineupPath && auth !== 'lineup' && auth !== 'admin' && auth !== 'official') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ANNOUNCER (Requires 'announcer' OR 'admin')
  if (isAnnouncerPath && auth !== 'announcer' && auth !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // REGISTRATION (Requires 'registration' OR 'admin')
  if (isRegPath && auth !== 'registration' && auth !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/trackside/:path*', 
    '/lineup/:path*', 
    '/announcer/:path*', 
    '/registration/:path*'
  ],
};