import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;

        const offer = await db.getOffer(id);

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Fetch the original booking to include in the response
        const booking = await db.getBooking(offer.booking_id, sessionId);

        return NextResponse.json({
            ...offer,
            options: offer.top3,
            original_booking: booking
        });
    } catch (e: any) {
        console.error('API Error /offers/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const sessionId = req.headers.get('x-session-id');

        const neon_sql = neon(process.env.POSTGRES_URL!);

        await neon_sql`DELETE FROM offers WHERE id = ${id}`;

        return NextResponse.json({
            status: 'ok',
            message: 'Offer deleted successfully'
        });
    } catch (e: any) {
        console.error('API Error DELETE /offers/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
