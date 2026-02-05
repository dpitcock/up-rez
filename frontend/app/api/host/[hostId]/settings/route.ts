import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;

        const settings = await db.getHostSettings(hostId, sessionId);
        if (!settings) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }
        return NextResponse.json(settings);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;
        const updates = await req.json();

        // Validate required fields
        if (typeof updates.max_discount_pct === 'number') {
            if (updates.max_discount_pct < 0 || updates.max_discount_pct > 1) {
                return NextResponse.json({ error: 'max_discount_pct must be between 0 and 1' }, { status: 400 });
            }
        }

        // Merge with hostId to ensure it's set
        const settingsToSave = {
            ...updates,
            host_id: hostId
        };

        await db.saveHostSettings(settingsToSave, sessionId);

        // Fetch and return updated settings
        const updatedSettings = await db.getHostSettings(hostId, sessionId);
        return NextResponse.json(updatedSettings);
    } catch (e: any) {
        console.error('Settings PATCH error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
