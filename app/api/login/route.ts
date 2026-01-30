import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Check against the environment variable (or a default for safety)
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin'; 

    if (password === correctPassword) {
      // Create the response
      const response = NextResponse.json({ success: true });
      
      // Set the "auth" cookie
      response.cookies.set('auth', 'true', {
        httpOnly: true, // Secure: JavaScript cannot read it
        path: '/',      // Valid for the whole site
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}