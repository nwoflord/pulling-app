import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 1. GET: Fetch codes (Used by your Admin Settings Page)
export async function GET() {
  try {
    // Queries your existing 'access_codes' table
    const result = await db.query('SELECT role, code FROM access_codes ORDER BY role ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });
  }
}

// 2. PUT: Update a specific code (Used by your Admin Settings Page)
export async function PUT(request: Request) {
  try {
    const { role, code } = await request.json();
    
    // Updates the code for a specific role
    await db.query('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// 3. POST: Verify password (Used by your Login Page)
// This is the function that actually checks the password against the database
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    // Check if the entered code exists in the database
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      // Success! Return the role so the frontend knows where to redirect
      return NextResponse.json({ success: true, role: result.rows[0].role });
    } else {
      // No match found
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    console.error("Login Verify Error:", error);
    return NextResponse.json({ error: 'Verification Failed' }, { status: 500 });
  }
}