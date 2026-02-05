import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';


const sql = neon(process.env.POSTGRES_URL!);

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.headers.get('x-session-id');

        const bookings = sessionId
            ? await sql`
                SELECT b.*, p.name as prop_name 
                FROM bookings b 
                JOIN properties p ON b.prop_id = p.id
                WHERE b.session_id = ${sessionId}
                ORDER BY b.arrival_date ASC
            `
            : await sql`
                SELECT b.*, p.name as prop_name 
                FROM bookings b 
                JOIN properties p ON b.prop_id = p.id
                WHERE b.session_id IS NULL
                ORDER BY b.arrival_date ASC
            `;

        return NextResponse.json(bookings);
    } catch (e: any) {
        console.error('API Error /bookings:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.headers.get('x-session-id') || null;
        const body = await req.json();

        // Validation
        if (!body.guest_name || body.guest_name.length < 2) {
            return NextResponse.json({ error: 'Guest name is required (min 2 characters)' }, { status: 400 });
        }
        if (!body.guest_email || !body.guest_email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }
        if (!body.prop_id) {
            return NextResponse.json({ error: 'Property is required' }, { status: 400 });
        }
        if (!body.arrival_date || !body.departure_date) {
            return NextResponse.json({ error: 'Arrival and departure dates are required' }, { status: 400 });
        }

        const arrivalDate = new Date(body.arrival_date);
        const departureDate = new Date(body.departure_date);

        if (departureDate <= arrivalDate) {
            return NextResponse.json({ error: 'Departure date must be after arrival date' }, { status: 400 });
        }

        if (!body.total_paid || body.total_paid <= 0) {
            return NextResponse.json({ error: 'Total paid must be greater than 0' }, { status: 400 });
        }

        // Calculate nights
        const nights = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        const baseNightlyRate = body.total_paid / nights;

        // Generate booking ID using random string (shortid replacement)
        const bookingId = `bkg_${Math.random().toString(36).substring(2, 15)}`;
        const now = new Date().toISOString();

        // Insert booking
        const result = await sql`
            INSERT INTO bookings (
                id, session_id, host_id, prop_id,
                arrival_date, departure_date, nights,
                guest_name, guest_email, guests,
                base_nightly_rate, total_paid,
                status, created_at
            ) VALUES (
                ${bookingId}, ${sessionId}, ${body.host_id || 'demo_host_001'}, ${body.prop_id},
                ${body.arrival_date}, ${body.departure_date}, ${nights},
                ${body.guest_name}, ${body.guest_email}, ${body.guests || 1},
                ${baseNightlyRate}, ${body.total_paid},
                ${body.status || 'confirmed'}, ${now}
            )
            RETURNING *
        `;

        return NextResponse.json(result[0], { status: 201 });
    } catch (e: any) {
        console.error('API Error POST /bookings:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
