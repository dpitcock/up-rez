import { NextRequest, NextResponse } from 'next/server';
import { generateOffer } from '@/lib/services/offerService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, booking_id } = body;

        if (!booking_id) {
            return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
        }

        if (type === 'cron' || type === 'cancellation') {
            const offerId = await generateOffer(booking_id);
            if (offerId) {
                return NextResponse.json({
                    status: 'ok',
                    offer_id: offerId,
                    message: `${type} offer generated and email sent`
                });
            } else {
                return NextResponse.json({ error: 'No suitable upgrade options found' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    } catch (e: any) {
        console.error('API Error /demo/trigger:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
