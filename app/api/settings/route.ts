import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic so Vercel doesn't cache the response
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

// POST: Verify & Set Cookie (Server Side)
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    // 1. Verify Password
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      const response = NextResponse.json({ success: true, role: role });

      // 2. SET COOKIE (Server Authority)
      // We use 'Lax' and httpOnly so the browser trusts it more
      response.cookies.set('auth', role, {
        httpOnly: true,  // JavaScript cannot touch this (More secure)
        path: '/',       // Valid for the whole site
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax', // Needed for redirects to work
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