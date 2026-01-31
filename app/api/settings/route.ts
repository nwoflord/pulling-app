import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 1. DISABLE CACHING (Critical for login APIs)
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

export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      const response = NextResponse.json({ success: true, role: role });

      // 2. SET COOKIE (looser security for reliability)
      response.cookies.set('auth', role, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production', // Only secure in live, not local
      });

      return response;
    } else {
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Verification Failed' }, { status: 500 });
  }
}