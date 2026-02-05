import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.headers.get('x-session-id');

        // Filter by session_id
        const allReady = sessionId
            ? await sql`
                SELECT b.*, p.name as prop_name 
                FROM bookings b 
                JOIN properties p ON b.prop_id = p.id
                WHERE b.status = 'confirmed' AND b.session_id = ${sessionId}
                ORDER BY b.arrival_date ASC
            `
            : await sql`
                SELECT b.*, p.name as prop_name 
                FROM bookings b 
                JOIN properties p ON b.prop_id = p.id
                WHERE b.status = 'confirmed' AND b.session_id IS NULL
                ORDER BY b.arrival_date ASC
            `;

        // Split them for the UI
        return NextResponse.json({
            cron_ready: allReady.slice(0, 3),
            cancellation_ready: allReady.slice(3, 6)
        });
    } catch (e: any) {
        console.error('API Error /demo/ready-bookings:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
