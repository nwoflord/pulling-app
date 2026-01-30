import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');

  try {
    let query = 'SELECT * FROM entries';
    const params: any[] = [];

    if (classId) {
      query += ' WHERE class_id = $1';
      params.push(classId);
    }
    
    query += ' ORDER BY truck_number ASC';

    const result = await db.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- UPDATED POST FUNCTION (Fixes Missing Data) ---
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. CHECK LOCK STATUS
        if (body.class_id) {
            const classCheck = await db.query('SELECT is_locked FROM classes WHERE class_id = $1', [body.class_id]);
            if (classCheck.rows[0]?.is_locked) {
                return NextResponse.json({ error: "Registration Closed: Bracket has already started." }, { status: 403 });
            }
        }

        // 2. EXTRACT ALL FIELDS (This was the missing piece!)
        const { 
            truck_number, 
            driver_name, 
            class_id, 
            truck_name, 
            hometown, 
            info, 
            checked_in 
        } = body;
        
        if (!truck_number || !class_id) {
             return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 3. INSERT FULL DATA
        await db.query(
            `INSERT INTO entries 
            (truck_number, driver_name, class_id, truck_name, hometown, info, checked_in, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                truck_number, 
                driver_name, 
                class_id, 
                truck_name || '', // Default to empty string if missing
                hometown || '', 
                info || '', 
                checked_in ?? false, // Default to false if missing
                'active'
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // CASE 1: CHECK-IN (Admin Station)
    if (body.action === 'check_in' && body.entry_ids) {
        // Handle Array of IDs
        for (const id of body.entry_ids) {
            await db.query(
                `UPDATE entries SET checked_in = TRUE, truck_number = $1 WHERE entry_id = $2`,
                [body.truck_number, id]
            );
        }
        return NextResponse.json({ success: true });
    }

    // CASE 2: STANDARD STATUS UPDATE (Lineup Screen)
    if (body.status && body.entry_id) {
        await db.query(
            'UPDATE entries SET status = $1 WHERE entry_id = $2',
            [body.status, body.entry_id]
        );
        return NextResponse.json({ success: true });
    }

    // CASE 3: SCRATCH ACTION (Admin Bracket)
    if (body.action === 'scratch' && body.entry_id) {
        await db.query(
            "UPDATE entries SET status = 'scratched' WHERE entry_id = $1",
            [body.entry_id]
        );
        return NextResponse.json({ success: true });
    }

    // CASE 4: ASSIGN FINISH POSITION (Reports)
    if (body.action === 'update_finish' && body.entry_id) {
        await db.query(
            'UPDATE entries SET finish_position = $1 WHERE entry_id = $2',
            [body.finish_position, body.entry_id]
        );
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await db.query('DELETE FROM entries WHERE entry_id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}