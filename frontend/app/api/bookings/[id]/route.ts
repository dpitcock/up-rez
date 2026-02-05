import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const sessionId = req.headers.get('x-session-id') || null;

        const bookings = await sql`
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            WHERE b.id = ${id} 
            AND (b.session_id = ${sessionId} OR (b.session_id IS NULL AND ${sessionId} IS NULL))
        `;

        if (bookings.length === 0) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(bookings[0]);
    } catch (e: any) {
        console.error('API Error GET /bookings/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const sessionId = req.headers.get('x-session-id') || null;
        const body = await req.json();

        // Verify booking belongs to this session
        const existing = await sql`
            SELECT * FROM bookings 
            WHERE id = ${id} 
            AND (session_id = ${sessionId} OR (session_id IS NULL AND ${sessionId} IS NULL))
        `;

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 });
        }

        // Calculate nights if dates changed
        let nights = existing[0].nights;
        let baseNightlyRate = existing[0].base_nightly_rate;

        if (body.arrival_date || body.departure_date) {
            const arrivalDate = new Date(body.arrival_date || existing[0].arrival_date);
            const departureDate = new Date(body.departure_date || existing[0].departure_date);

            if (departureDate <= arrivalDate) {
                return NextResponse.json({ error: 'Departure date must be after arrival date' }, { status: 400 });
            }

            nights = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (body.total_paid) {
            baseNightlyRate = body.total_paid / nights;
        }

        const now = new Date().toISOString();

        // Update booking
        const result = await sql`
            UPDATE bookings SET
                guest_name = COALESCE(${body.guest_name}, guest_name),
                guest_email = COALESCE(${body.guest_email}, guest_email),
                prop_id = COALESCE(${body.prop_id}, prop_id),
                arrival_date = COALESCE(${body.arrival_date}, arrival_date),
                departure_date = COALESCE(${body.departure_date}, departure_date),
                nights = ${nights},
                total_paid = COALESCE(${body.total_paid}, total_paid),
                guests = COALESCE(${body.guests}, guests),
                base_nightly_rate = ${baseNightlyRate},
                status = COALESCE(${body.status}, status)
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json(result[0]);
    } catch (e: any) {
        console.error('API Error PATCH /bookings/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const sessionId = req.headers.get('x-session-id') || null;

        // Verify booking belongs to this session before deleting
        const result = await sql`
            DELETE FROM bookings 
            WHERE id = ${id} 
            AND (session_id = ${sessionId} OR (session_id IS NULL AND ${sessionId} IS NULL))
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Booking deleted' });
    } catch (e: any) {
        console.error('API Error DELETE /bookings/[id]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
