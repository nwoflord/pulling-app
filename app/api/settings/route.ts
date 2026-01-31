import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust path if needed (e.g. '../lib/db' or '@lib/db')

// 1. GET: Fetch codes (For Admin Settings Page)
export async function GET() {
  try {
    // Queries the access_codes table using your existing db connection
    const result = await db.query('SELECT role, code FROM access_codes ORDER BY role ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });
  }
}

// 2. PUT: Update a specific code (For Admin Settings Page)
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

// 3. POST: Verify password (For Login Page)
// THIS IS THE MISSING PART THAT FIXES THE "HANG"
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    // Check if the entered code exists in the database
    const result = await db.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      // Success! Return the role (e.g., 'admin') so the login page knows where to go
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