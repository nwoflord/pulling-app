import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Validated import path

// Helper to handle DB Query with a timeout so it doesn't hang forever
async function queryWithTimeout(text: string, params: any[]) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Database timeout')), 5000)
  );
  
  // Race the query against a 5-second timer
  return Promise.race([
    db.query(text, params),
    timeoutPromise
  ]) as Promise<any>;
}

// 1. GET: Fetch codes
export async function GET() {
  try {
    const result = await queryWithTimeout('SELECT role, code FROM access_codes ORDER BY role ASC', []);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("GET API Error:", error.message);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

// 2. PUT: Update codes
export async function PUT(request: Request) {
  try {
    const { role, code } = await request.json();
    await queryWithTimeout('UPDATE access_codes SET code = $1 WHERE role = $2', [code, role]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT API Error:", error.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 3. POST: Verify Login (The part that was hanging)
export async function POST(request: Request) {
  console.log("Login POST received...");
  
  try {
    const body = await request.json();
    const { attempt } = body;
    
    if (!attempt) {
      console.log("No password provided");
      return NextResponse.json({ success: false });
    }

    // Run query with 5s timeout
    const result = await queryWithTimeout('SELECT role FROM access_codes WHERE code = $1 LIMIT 1', [attempt]);
    
    if (result.rows.length > 0) {
      console.log("Login Success for role:", result.rows[0].role);
      return NextResponse.json({ success: true, role: result.rows[0].role });
    } else {
      console.log("Login Failed: Incorrect code");
      return NextResponse.json({ success: false });
    }

  } catch (error: any) {
    // This catches both connection errors and timeouts
    console.error("LOGIN CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: 'Server Verification Failed' }, { status: 500 });
  }
}