import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Read the securely encrypted httpOnly cookie containing their role.
    const cookieStore = await cookies();
    const role = cookieStore.get('auth')?.value || null;
    
    return NextResponse.json({ role });
}
