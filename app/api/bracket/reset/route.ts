import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const { class_id } = await request.json();

    // 1. Delete all hooks (matches) for this class
    await db.query('DELETE FROM hooks WHERE class_id = $1', [class_id]);

    // 2. Reset entry statuses (optional, but good for cleanup)
    await db.query("UPDATE entries SET status = 'active', finish_position = NULL WHERE class_id = $1", [class_id]);

    // 3. UNLOCK the class
    await db.query('UPDATE classes SET is_locked = FALSE WHERE class_id = $1', [class_id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}