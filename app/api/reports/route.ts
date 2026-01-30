import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function GET(request: Request) {
  try {
    // UPDATED QUERY: Using your actual column names
    const query = `
      SELECT 
        c.class_id, 
        c.name, 
        c.hook_fee, 
        c.added_money,
        c.payback_percent,
        c.payout_split,
        COUNT(e.entry_id)::int as entry_count
      FROM classes c
      LEFT JOIN entries e ON c.class_id = e.class_id
      GROUP BY c.class_id
      ORDER BY c.name ASC
    `;
    
    const result = await db.query(query);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Reports API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}