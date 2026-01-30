import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function PUT(request: Request) {
  try {
    const { entry_id, status } = await request.json();

    if (!entry_id || !status) {
      return NextResponse.json({ error: "Missing ID or status" }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE entries SET status = $1 WHERE entry_id = $2 RETURNING *`,
      [status, entry_id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}