import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 1. GET: Fetch codes
export async function GET() {
  try {
    const result = await db.query('SELECT role, code FROM access_codes ORDER BY role ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });
  }
}

// 2. PUT: Update a specific code
export async function PUT(request: Request) {
  try {
    const { role, code } = await request.json();
    await db.query('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// 3. POST: Verify password AND Set Cookie
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    // Check DB
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      
      // Create the Success Response
      const response = NextResponse.json({ success: true, role: role });

      // CRITICAL FIX: Set the cookie on the SERVER SIDE
      // This forces the browser to accept the login
      response.cookies.set('auth', role, {
        httpOnly: false, // Allow client to read if necessary
        path: '/',       // Valid for the whole site
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax'
      });

      return response;
    } else {
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    console.error("Login Verify Error:", error);
    return NextResponse.json({ error: 'Verification Failed' }, { status: 500 });
  }
}