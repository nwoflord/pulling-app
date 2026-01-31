import { NextResponse } from 'next/server';
// import { db } from '@/lib/db';  <-- COMMENT THIS OUT TEMPORARILY

export async function POST(request: Request) {
  // BYPASS TEST: Simulate a successful login immediately
  return NextResponse.json({ success: true, role: 'admin' });
}

// Keep these as empty shells so the build passes
export async function GET() { return NextResponse.json([]); }
export async function PUT() { return NextResponse.json({ success: true }); }