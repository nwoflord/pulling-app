import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const { class_id } = await request.json();
    if (!class_id) return NextResponse.json({ error: "Class ID required" }, { status: 400 });

    // --- 1. CLEANUP (Reset everything first) ---
    // Delete all existing hooks (matches) for this class
    await db.query('DELETE FROM hooks WHERE class_id = $1', [class_id]);

    // Reset entry statuses to 'active' and remove finish positions
    await db.query("UPDATE entries SET status = 'active', finish_position = NULL WHERE class_id = $1", [class_id]);

    // --- 2. GENERATE NEW BRACKET ---
    // Fetch all entries for this class
    const res = await db.query('SELECT entry_id FROM entries WHERE class_id = $1', [class_id]);
    let entries = res.rows;

    if (entries.length < 2) {
        return NextResponse.json({ error: "Need at least 2 trucks to generate a bracket." }, { status: 400 });
    }

    // Shuffle entries (Randomize the bracket)
    entries = entries.sort(() => Math.random() - 0.5);

    // Create Pairings (Round 1)
    let matchOrder = 1;
    for (let i = 0; i < entries.length; i += 2) {
        if (i + 1 < entries.length) {
            // Standard Pair (Truck A vs Truck B)
            await db.query(
                `INSERT INTO hooks (class_id, round, match_order, entry1_id, entry2_id) VALUES ($1, $2, $3, $4, $5)`,
                [class_id, 1, matchOrder++, entries[i].entry_id, entries[i+1].entry_id]
            );
        } else {
            // Odd Truck Out (BYE) - Automatically set them as the winner of this match
            await db.query(
                `INSERT INTO hooks (class_id, round, match_order, entry1_id, winner_entry_id) VALUES ($1, $2, $3, $4, $4)`,
                [class_id, 1, matchOrder++, entries[i].entry_id, entries[i].entry_id]
            );
        }
    }

    // --- 3. LOCK THE CLASS ---
    // This prevents new registrations while the bracket is active
    await db.query('UPDATE classes SET is_locked = TRUE WHERE class_id = $1', [class_id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}