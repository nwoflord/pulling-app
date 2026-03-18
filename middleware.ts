import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('auth')?.value;
  const path = request.nextUrl.pathname;

  // 1. Define Paths
  const isAdminPath = path.startsWith('/admin') && !path.startsWith('/admin/settings');
  const isSettingsPath = path.startsWith('/admin/settings');
  const isOfficialPath = path.startsWith('/trackside');
  const isLineupPath = path.startsWith('/lineup');
  const isAnnouncerPath = path.startsWith('/announcer');
  const isRegPath = path.startsWith('/registration');

  // 2. Check Permissions
  // If trying to access a protected area, check if the specific role matches
  // SETTINGS (Requires 'superadmin' exclusively)
  if (isSettingsPath && auth !== 'superadmin') {
     return NextResponse.redirect(new URL('/admin', request.url));
  }

  // ADMIN (Requires 'admin' or 'superadmin')
  if (isAdminPath && auth !== 'admin' && auth !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // OFFICIAL (Requires 'official' OR 'admin' OR 'superadmin')
  if (isOfficialPath && auth !== 'official' && auth !== 'admin' && auth !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // LINEUP (Requires 'lineup' OR 'admin' OR 'official' OR 'superadmin')
  if (isLineupPath && auth !== 'lineup' && auth !== 'admin' && auth !== 'official' && auth !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ANNOUNCER (Requires 'announcer' OR 'admin' OR 'superadmin')
  if (isAnnouncerPath && auth !== 'announcer' && auth !== 'admin' && auth !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // REGISTRATION (Requires 'registration' OR 'admin' OR 'superadmin')
  if (isRegPath && auth !== 'registration' && auth !== 'admin' && auth !== 'superadmin') {
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