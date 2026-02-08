import { neon } from '@neondatabase/serverless';
import { Booking, Property, Offer, HostSettings } from '@/types';

const sql = neon(process.env.POSTGRES_URL!);

// This is a helper to handle both Vercel Postgres and potentially a local mock for development
export const db = {
    async getBooking(id: string, sessionId?: string): Promise<Booking | null> {
        try {
            const rows = sessionId
                ? await sql`
                    SELECT b.*, p.name as prop_name 
                    FROM bookings b 
                    JOIN properties p ON b.prop_id = p.id 
                    WHERE b.id = ${id} AND b.session_id = ${sessionId}`
                : await sql`
                    SELECT b.*, p.name as prop_name 
                    FROM bookings b 
                    JOIN properties p ON b.prop_id = p.id 
                    WHERE b.id = ${id}`;

            return (rows[0] as Booking & { prop_name: string }) || null;
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

    async getHostSettings(hostId: string, sessionId?: string): Promise<HostSettings | null> {
        try {
            // Try session-scoped settings first if sessionId provided
            if (sessionId) {
                const sessionRows = await sql`
                    SELECT * FROM host_settings 
                    WHERE host_id = ${hostId} AND session_id = ${sessionId}
                `;
                if (sessionRows.length > 0) {
                    return sessionRows[0] as HostSettings;
                }
            }

            // Fallback to global settings (empty string)
            const globalRows = await sql`
                SELECT * FROM host_settings 
                WHERE host_id = ${hostId} AND session_id = ''
            `;
            return (globalRows[0] as HostSettings) || null;
        } catch (e) {
            console.error('DB Error getHostSettings:', e);
            return null;
        }
    },

    async saveHostSettings(settings: Partial<HostSettings>, sessionId?: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            const hostId = settings.host_id || 'demo_host_001';
            const sessId = sessionId || '';

            await sql`
                INSERT INTO host_settings (
                    host_id, session_id, host_name, host_phone, pm_company_name,
                    min_revenue_lift_eur_per_night, max_discount_pct,
                    min_adr_ratio, max_adr_multiplier,
                    channel_fee_pct, change_fee_eur,
                    active_email_template_id, active_landing_template_id,
                    max_distance_to_beach_m, offer_validity_hours,
                    use_openai_for_copy, offers_sent_this_month, revenue_lifted_this_month,
                    created_at, updated_at
                )
                VALUES (
                    ${hostId}, ${sessId}, ${settings.host_name}, ${settings.host_phone}, ${settings.pm_company_name},
                    ${settings.min_revenue_lift_eur_per_night}, ${settings.max_discount_pct},
                    ${settings.min_adr_ratio}, ${settings.max_adr_multiplier},
                    ${settings.channel_fee_pct}, ${settings.change_fee_eur},
                    ${settings.active_email_template_id}, ${settings.active_landing_template_id},
                    ${settings.max_distance_to_beach_m}, ${settings.offer_validity_hours},
                    ${settings.use_openai_for_copy}, ${settings.offers_sent_this_month || 0}, ${settings.revenue_lifted_this_month || 0},
                    ${now}, ${now}
                )
                ON CONFLICT (host_id, session_id) DO UPDATE SET
                    host_name = EXCLUDED.host_name,
                    host_phone = EXCLUDED.host_phone,
                    pm_company_name = EXCLUDED.pm_company_name,
                    min_revenue_lift_eur_per_night = EXCLUDED.min_revenue_lift_eur_per_night,
                    max_discount_pct = EXCLUDED.max_discount_pct,
                    min_adr_ratio = EXCLUDED.min_adr_ratio,
                    max_adr_multiplier = EXCLUDED.max_adr_multiplier,
                    channel_fee_pct = EXCLUDED.channel_fee_pct,
                    change_fee_eur = EXCLUDED.change_fee_eur,
                    active_email_template_id = EXCLUDED.active_email_template_id,
                    active_landing_template_id = EXCLUDED.active_landing_template_id,
                    max_distance_to_beach_m = EXCLUDED.max_distance_to_beach_m,
                    offer_validity_hours = EXCLUDED.offer_validity_hours,
                    use_openai_for_copy = EXCLUDED.use_openai_for_copy,
                    offers_sent_this_month = EXCLUDED.offers_sent_this_month,
                    revenue_lifted_this_month = EXCLUDED.revenue_lifted_this_month,
                    updated_at = EXCLUDED.updated_at
            `;
        } catch (e) {
            console.error('DB Error saveHostSettings:', e);
            throw e;
        }
    },

    async saveOffer(offer: Partial<Offer>, sessionId?: string): Promise<void> {
        try {
            const top3Json = JSON.stringify(offer.top3);
            // Ensure session_id is saved
            const sessId = sessionId || offer.session_id || null;

            await sql`
                INSERT INTO offers (id, booking_id, status, top3, expires_at, email_subject, email_body_html, created_at, session_id)
                VALUES (${offer.id}, ${offer.booking_id}, ${offer.status}, ${top3Json}, ${offer.expires_at}, ${offer.email_subject}, ${offer.email_body_html}, ${offer.created_at}, ${sessId})
                ON CONFLICT (booking_id) DO UPDATE SET
                    id = EXCLUDED.id,
                    status = EXCLUDED.status,
                    top3 = EXCLUDED.top3,
                    expires_at = EXCLUDED.expires_at,
                    email_subject = EXCLUDED.email_subject,
                    email_body_html = EXCLUDED.email_body_html,
                    created_at = EXCLUDED.created_at,
                    session_id = EXCLUDED.session_id
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
    },

    async getOfferByBookingId(bookingId: string, sessionId?: string): Promise<Offer | null> {
        try {
            const rows = await sql`SELECT * FROM offers WHERE booking_id = ${bookingId}`;
            const offer = rows[0] as any;
            if (offer && typeof offer.top3 === 'string') {
                offer.top3 = JSON.parse(offer.top3);
            }
            return offer || null;
        } catch (e) {
            console.error('DB Error getOfferByBookingId:', bookingId, e);
            return null;
        }
    },

    async updateOfferStatus(id: string, status: string, selectedPropId?: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            if (selectedPropId) {
                await sql`
                    UPDATE offers 
                    SET status = ${status}, selected_prop_id = ${selectedPropId}, updated_at = ${now}
                    WHERE id = ${id}
                `;
            } else {
                await sql`
                    UPDATE offers 
                    SET status = ${status}, updated_at = ${now}
                    WHERE id = ${id}
                `;
            }
        } catch (e) {
            console.error('DB Error updateOfferStatus:', e);
            throw e;
        }
    },

    async updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
        try {
            const now = new Date().toISOString();
            const current = await this.getBooking(id);
            if (!current) throw new Error('Booking not found');

            // Construct dynamic update if needed, or simple fixed ones for now
            // For now, let's just update property and rate if they are in the updates
            const propId = updates.prop_id || current.prop_id;
            const status = updates.status || current.status;
            const upgradedFrom = updates.upgraded_from_prop_id || current.upgraded_from_prop_id;
            const nightlyRate = updates.base_nightly_rate || current.base_nightly_rate;
            const totalPaid = updates.total_paid || current.total_paid;
            const upgradeAt = updates.upgrade_at || current.upgrade_at;

            await sql`
                UPDATE bookings 
                SET prop_id = ${propId}, 
                    status = ${status}, 
                    upgraded_from_prop_id = ${upgradedFrom},
                    base_nightly_rate = ${nightlyRate},
                    total_paid = ${totalPaid},
                    upgrade_at = ${upgradeAt},
                    updated_at = ${now}
                WHERE id = ${id}
            `;
        } catch (e) {
            console.error('DB Error updateBooking:', e);
            throw e;
        }
    }
};
