import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const arrivalDate = searchParams.get('arrival_date');
        const departureDate = searchParams.get('departure_date');

        let properties;

        if (arrivalDate && departureDate) {
            // Fetch only available properties for the given date range
            // We check against the bookings table for overlaps
            properties = await sql`
                SELECT p.id, p.name, p.location, p.beds, p.baths, p.list_nightly_rate, p.type
                FROM properties p
                WHERE p.id NOT IN (
                    SELECT b.prop_id 
                    FROM bookings b 
                    WHERE b.status != 'cancelled'
                    AND (
                        (b.arrival_date <= ${arrivalDate} AND b.departure_date > ${arrivalDate}) OR
                        (b.arrival_date < ${departureDate} AND b.departure_date >= ${departureDate}) OR
                        (${arrivalDate} <= b.arrival_date AND ${departureDate} >= b.departure_date)
                    )
                )
                ORDER BY p.name ASC
            `;
        } else {
            // Returns all properties if no dates provided
            properties = await sql`
                SELECT id, name, location, beds, baths, list_nightly_rate, type
                FROM properties 
                ORDER BY name ASC
            `;
        }

        return NextResponse.json(properties);
    } catch (e: any) {
        console.error('API Error /properties:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
