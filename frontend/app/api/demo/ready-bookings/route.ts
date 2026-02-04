import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
    try {
        // Ported query from Python demo router
        const cron_ready = await sql`
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            WHERE b.status = 'confirmed'
            LIMIT 5
        `;

        const cancellation_ready = await sql`
            SELECT b.*, p.name as prop_name 
            FROM bookings b 
            JOIN properties p ON b.prop_id = p.id
            WHERE b.id LIKE 'demo_prem_%' AND b.status = 'confirmed'
        `;

        return NextResponse.json({
            cron_ready,
            cancellation_ready
        });
    } catch (e: any) {
        console.error('API Error /demo/ready-bookings:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
