import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Overwrite the cookie with an expired date
  // This forces the browser to delete it immediately
  response.cookies.set('auth', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0), // Set date to 1970 (expired)
  });

  return response;
}