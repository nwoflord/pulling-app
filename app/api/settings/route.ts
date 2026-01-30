import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

// GET: Fetch all codes (For Admin Settings Page)
export async function GET(request: Request) {
  try {
    const result = await db.query('SELECT * FROM access_codes ORDER BY role');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update a specific code
export async function PUT(request: Request) {
  try {
    const { role, code } = await request.json();
    await db.query('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Verify a login attempt (For Login Page)
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    // Check if the code exists in the database
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1', [attempt]);
    
    if (result.rows.length > 0) {
        return NextResponse.json({ success: true, role: result.rows[0].role });
    } else {
        return NextResponse.json({ success: false });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}