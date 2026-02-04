import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
    try {
        const bookings = await sql`
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            ORDER BY b.arrival_date ASC
        `;

        return NextResponse.json(bookings);
    } catch (e: any) {
        console.error('API Error /bookings:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
