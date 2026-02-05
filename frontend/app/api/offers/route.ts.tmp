import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.headers.get('x-session-id');

        const offers = sessionId
            ? await sql`
                SELECT o.*, b.guest_name, p.name as prop_name
                FROM offers o
                JOIN bookings b ON o.booking_id = b.id
                JOIN properties p ON b.prop_id = p.id
                WHERE o.session_id = ${sessionId}
                ORDER BY o.created_at DESC
            `
            : await sql`
                SELECT o.*, b.guest_name, p.name as prop_name
                FROM offers o
                JOIN bookings b ON o.booking_id = b.id
                JOIN properties p ON b.prop_id = p.id
                WHERE o.session_id IS NULL
                ORDER BY o.created_at DESC
            `;

        // Parse top3 JSON if it's a string
        const parsedOffers = offers.map((o: any) => {
            if (typeof o.top3 === 'string') {
                try {
                    o.top3 = JSON.parse(o.top3);
                } catch (e) {
                    console.error("Failed to parse top3 JSON for offer", o.id);
                }
            }
            return o;
        });

        return NextResponse.json(parsedOffers);
    } catch (e: any) {
        console.error('API Error /offers:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
