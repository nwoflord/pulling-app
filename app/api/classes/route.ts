import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

// 1. GET: Fetch all classes
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM classes ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new class (This is your existing code)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Sending to DB:", body);

    const result = await db.query(
      `INSERT INTO classes (
         name, 
         hook_fee, 
         added_money, 
         sponsor_name,          
         payout_distribution
       ) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        body.name,                  
        Number(body.hook_fee),      
        Number(body.added_money),   
        body.sponsor,               
        JSON.stringify(body.payout_distribution) 
      ]
    );

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to create class", details: error.message }, 
      { status: 500 }
    );
  }
}
// 3. DELETE: Remove a class by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Delete the class
    await db.query('DELETE FROM classes WHERE class_id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}