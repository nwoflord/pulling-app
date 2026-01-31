import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Nuke the cookie from orbit (expire it in the past)
  response.cookies.set('auth', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0), // Set to 1970
  });

  return response;
}