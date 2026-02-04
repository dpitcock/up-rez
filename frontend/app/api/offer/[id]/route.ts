import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const offer = await db.getOffer(id);

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Fetch the original booking to include in the response
        const booking = await db.getBooking(offer.booking_id);

        return NextResponse.json({
            ...offer,
            options: offer.top3,
            original_booking: booking
        });
    } catch (e: any) {
        console.error('API Error /offer/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
