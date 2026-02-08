import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function POST() {
    try {
        // cleanup threshold: 24 hours
        // Can be configurable via env or query param if needed
        const thresholdHours = 24;
        const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();

        console.log(`🧹 Running cleanup for sessions older than ${cutoff} (${thresholdHours} hours)`);

        // Delete stale offers
        // We delete by created_at of the offer itself, assuming offers creation roughly tracks session activity
        // OR we can delete based on booking created_at.
        // Let's rely on 'created_at' and 'session_id IS NOT NULL' to target demo sessions.

        const deletedOffers = await sql`
            WITH deleted AS (
                DELETE FROM offers 
                WHERE session_id IS NOT NULL 
                AND created_at < ${cutoff}
                RETURNING id
            )
            SELECT count(*) FROM deleted;
        `;

        const deletedBookings = await sql`
            WITH deleted AS (
                DELETE FROM bookings 
                WHERE session_id IS NOT NULL 
                AND created_at < ${cutoff}
                RETURNING id
            )
            SELECT count(*) FROM deleted;
        `;

        const deletedSettings = await sql`
            WITH deleted AS (
                DELETE FROM host_settings
                WHERE session_id IS NOT NULL
                AND created_at < ${cutoff}
                RETURNING host_id
            )
            SELECT count(*) FROM deleted;
        `;

        const offersCount = deletedOffers[0]?.count || 0;
        const bookingsCount = deletedBookings[0]?.count || 0;
        const settingsCount = deletedSettings[0]?.count || 0;

        console.log(`✅ Cleanup Complete. Deleted ${offersCount} offers, ${bookingsCount} bookings, and ${settingsCount} host settings.`);

        return NextResponse.json({
            status: 'ok',
            message: `Cleanup successful. Removed data older than ${thresholdHours} hours.`,
            stats: {
                deleted_offers: Number(offersCount),
                deleted_bookings: Number(bookingsCount),
                deleted_settings: Number(settingsCount)
            }
        });

    } catch (e: any) {
        console.error('Cleanup Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
