import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');

  if (!classId) return NextResponse.json({ error: "Class ID required" }, { status: 400 });

  try {
    const result = await db.query(
      `SELECT 
        h.hook_id, h.round, h.bracket_position, h.next_hook_id, h.winner_entry_id, h.match_order,
        h.entry1_id, h.entry2_id,
        
        -- INCLUDE STATUS HERE
        e1.truck_number as truck1_number, e1.driver_name as driver1_name, e1.status as status1,
        e2.truck_number as truck2_number, e2.driver_name as driver2_name, e2.status as status2,
        
        ew.truck_number as winner_number
       FROM hooks h
       LEFT JOIN entries e1 ON h.entry1_id = e1.entry_id
       LEFT JOIN entries e2 ON h.entry2_id = e2.entry_id
       LEFT JOIN entries ew ON h.winner_entry_id = ew.entry_id
       WHERE h.class_id = $1
       ORDER BY h.round ASC, h.match_order ASC`, 
      [classId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (body.winner_entry_id) {
        await db.query('UPDATE hooks SET winner_entry_id = $1 WHERE hook_id = $2', [body.winner_entry_id, body.hook_id]);

        if (body.next_hook_id) {
            const isTop = body.position === 1 || body.position === 'top';
            const positionField = isTop ? 'entry1_id' : 'entry2_id';

            await db.query(
                `UPDATE hooks SET ${positionField} = $1 WHERE hook_id = $2`,
                [body.winner_entry_id, body.next_hook_id]
            );
            
            // Only set to 'needs_found' if they aren't scratched (just a safety check)
            await db.query("UPDATE entries SET status = 'needs_found' WHERE entry_id = $1 AND status != 'scratched'", [body.winner_entry_id]);
        }
        return NextResponse.json({ success: true });
    }

    if (body.action === 'reset') {
        await recursiveReset(body.hook_id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function recursiveReset(hookId: string) {
    const res = await db.query('SELECT * FROM hooks WHERE hook_id = $1', [hookId]);
    const hook = res.rows[0];
    if (!hook) return;

    if (hook.next_hook_id && hook.winner_entry_id) {
        await recursiveReset(hook.next_hook_id);
        const isTop = hook.bracket_position === 1 || hook.bracket_position === 'top';
        const positionField = isTop ? 'entry1_id' : 'entry2_id';
        await db.query(`UPDATE hooks SET ${positionField} = NULL WHERE hook_id = $1 AND ${positionField} = $2`, [hook.next_hook_id, hook.winner_entry_id]);
    }
    await db.query('UPDATE hooks SET winner_entry_id = NULL WHERE hook_id = $1', [hookId]);
}