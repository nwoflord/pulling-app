import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function DELETE(request: Request) {
  try {
    // 1. Delete Hooks first (they depend on entries)
    await db.query('DELETE FROM hooks');
    
    // 2. Delete Entries next (they depend on classes)
    await db.query('DELETE FROM entries');
    
    // 3. Delete Classes last
    await db.query('DELETE FROM classes');

    // 4. Delete Sponsors (New)
    await db.query('DELETE FROM sponsors');
    
    // NOTE: We do NOT delete 'access_codes' so you don't get locked out!

    return NextResponse.json({ success: true, message: "Event data wiped successfully." });
  } catch (error: any) {
    console.error("Reset Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}