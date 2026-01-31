import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CRITICAL: This ensures Vercel doesn't serve a "cached" version of the login
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.query('SELECT role, code FROM access_codes ORDER BY role ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { role, code } = await request.json();
    await db.query('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// POST: Verify Password & Issue Cookie
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      const response = NextResponse.json({ success: true, role: role });

      // ISSUE THE COOKIE
      response.cookies.set('auth', role, {
        httpOnly: true,  // Important: JavaScript CANNOT see this (Secure)
        path: '/',       // Works on all pages
        maxAge: 60 * 60 * 24 * 7, // 1 Week
        sameSite: 'lax', // Needed for navigation to work
        secure: process.env.NODE_ENV === 'production', // Only secure on live site
      });

      return response;
    } else {
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: 'Verification Failed' }, { status: 500 });
  }
}