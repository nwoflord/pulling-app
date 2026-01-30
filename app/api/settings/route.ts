import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Connect using the Supabase DATABASE_URL from your .env.local / Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 1. GET: Fetch all codes (Used by your Admin Settings Page)
export async function GET() {
  try {
    const client = await pool.connect();
    // Fetch from your existing 'access_codes' table
    const result = await client.query('SELECT role, code FROM access_codes ORDER BY role ASC');
    client.release();
    
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
    
    const client = await pool.connect();
    // Update the specific role in 'access_codes'
    await client.query('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    client.release();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// 3. POST: Verify password (Used by your Login Page)
// THIS IS THE MISSING PIECE THAT FIXES THE HANG
export async function POST(request: Request) {
  try {
    const { attempt } = await request.json();
    
    const client = await pool.connect();
    // Check if the entered code exists in 'access_codes'
    const result = await client.query('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    client.release();
    
    if (result.rows.length > 0) {
      // Success! Return the role (e.g., 'admin') so the frontend knows where to go
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