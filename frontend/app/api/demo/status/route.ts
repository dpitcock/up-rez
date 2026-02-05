import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.headers.get('x-session-id');

        const cronRows = sessionId
            ? await sql`SELECT COUNT(*) FROM bookings WHERE status != 'cancelled' AND session_id = ${sessionId}`
            : await sql`SELECT COUNT(*) FROM bookings WHERE status != 'cancelled' AND session_id IS NULL`;

        const offersRows = sessionId
            ? await sql`SELECT COUNT(*) FROM offers WHERE session_id = ${sessionId} AND status = 'active'`
            : await sql`SELECT COUNT(*) FROM offers WHERE session_id IS NULL AND status = 'active'`;

        return NextResponse.json({
            cron_ready_count: parseInt((cronRows[0] as any).count),
            active_offers: parseInt((offersRows[0] as any).count),
            demo_ready: true,
            email_enabled: process.env.EMAIL_ENABLED === 'true',
            contact_email: process.env.CONTACT_EMAIL || 'not set',
            timestamp: new Date().toISOString()
        });
    } catch (e: any) {
        console.error('API Error /demo/status:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
