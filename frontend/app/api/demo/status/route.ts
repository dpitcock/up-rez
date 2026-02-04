import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
    try {
        const cronRows = await sql`SELECT COUNT(*) FROM bookings WHERE status != 'cancelled'`;
        const premRows = await sql`SELECT COUNT(*) FROM bookings WHERE id LIKE 'demo_prem_%' AND status = 'confirmed'`;

        return NextResponse.json({
            cron_ready_count: parseInt((cronRows[0] as any).count),
            cancellation_ready_count: parseInt((premRows[0] as any).count),
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
