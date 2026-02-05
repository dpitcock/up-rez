import { NextRequest, NextResponse } from 'next/server';
import { generateOptionCopy } from '@/lib/services/offerService';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: offerId } = await context.params;
        const { prop_id } = await req.json();
        const sessionId = req.headers.get('x-session-id') || undefined;

        if (!prop_id) {
            return NextResponse.json({ error: 'prop_id is required' }, { status: 400 });
        }

        const aiCopy = await generateOptionCopy(offerId, prop_id, sessionId);

        return NextResponse.json({
            status: 'ok',
            ai_copy: aiCopy
        });
    } catch (e: any) {
        console.error('API Error /offer/[id]/generate-option:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
