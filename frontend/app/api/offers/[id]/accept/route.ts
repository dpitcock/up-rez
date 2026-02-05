import { NextRequest, NextResponse } from 'next/server';
import { acceptOffer } from '@/lib/services/offerService';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { prop_id } = await req.json();
        const sessionId = req.headers.get('x-session-id') || undefined;

        if (!prop_id) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const result = await acceptOffer(id, prop_id, sessionId);

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('API Error /offers/[id]/accept:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
