import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const settings = await db.getHostSettings(hostId);
        if (!settings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }
        return NextResponse.json(settings);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
