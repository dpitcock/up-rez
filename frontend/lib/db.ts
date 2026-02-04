import { neon } from '@neondatabase/serverless';
import { Booking, Property, Offer, HostSettings } from '@/types';

const sql = neon(process.env.POSTGRES_URL!);

// This is a helper to handle both Vercel Postgres and potentially a local mock for development
export const db = {
    async getBooking(id: string): Promise<Booking | null> {
        try {
            const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
            return (rows[0] as Booking) || null;
        } catch (e) {
            console.error('DB Error getBooking:', e);
            return null;
        }
    },

    async getProperty(id: string): Promise<Property | null> {
        try {
            const rows = await sql`SELECT * FROM properties WHERE id = ${id}`;
            return (rows[0] as Property) || null;
        } catch (e) {
            console.error('DB Error getProperty:', e);
            return null;
        }
    },

    async getAllProperties(): Promise<Property[]> {
        try {
            const rows = await sql`SELECT * FROM properties`;
            return rows as Property[];
        } catch (e) {
            console.error('DB Error getAllProperties:', e);
            return [];
        }
    },

    async getHostSettings(hostId: string): Promise<HostSettings | null> {
        try {
            const rows = await sql`SELECT * FROM host_settings WHERE host_id = ${hostId}`;
            return (rows[0] as HostSettings) || null;
        } catch (e) {
            console.error('DB Error getHostSettings:', e);
            return null;
        }
    },

    async saveOffer(offer: Partial<Offer>): Promise<void> {
        try {
            const top3Json = JSON.stringify(offer.top3);
            await sql`
                INSERT INTO offers (id, booking_id, status, top3, expires_at, email_subject, email_body_html, created_at)
                VALUES (${offer.id}, ${offer.booking_id}, ${offer.status}, ${top3Json}, ${offer.expires_at}, ${offer.email_subject}, ${offer.email_body_html}, ${offer.created_at})
                ON CONFLICT (booking_id) DO UPDATE SET
                    id = EXCLUDED.id,
                    status = EXCLUDED.status,
                    top3 = EXCLUDED.top3,
                    expires_at = EXCLUDED.expires_at,
                    email_subject = EXCLUDED.email_subject,
                    email_body_html = EXCLUDED.email_body_html,
                    created_at = EXCLUDED.created_at
            `;
        } catch (e) {
            console.error('DB Error saveOffer:', e);
            throw e;
        }
    },

    async getOffer(id: string): Promise<Offer | null> {
        try {
            const rows = await sql`SELECT * FROM offers WHERE id = ${id}`;
            const offer = rows[0] as any;
            if (offer && typeof offer.top3 === 'string') {
                offer.top3 = JSON.parse(offer.top3);
            }
            return offer || null;
        } catch (e) {
            console.error('DB Error getOffer:', id, e);
            return null;
        }
    }
};
