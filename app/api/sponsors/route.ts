import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function GET(request: Request) {
  try {
    const result = await db.query('SELECT * FROM sponsors ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    
    await db.query('INSERT INTO sponsors (name) VALUES ($1)', [name]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.query('DELETE FROM sponsors WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}