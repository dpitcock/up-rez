import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function POST(req: NextRequest) {
    try {
        let sessionId = req.headers.get('x-session-id');

        try {
            const body = await req.json();
            if (body.session_id) sessionId = body.session_id;
        } catch (e) {
            // Body might be empty, that's fine if we have the header
        }

        // Verify session_id presence if we want to enforce it, or make it optional for global reset
        // For now, let's allow optional, but if present, we scope the seed.

        // 1. Schema Migration (Idempotent)
        await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_id TEXT`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON bookings(session_id)`;

        await sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS session_id TEXT`;
        await sql`CREATE INDEX IF NOT EXISTS idx_offers_session_id ON offers(session_id)`;

        // 0. Ensure properties table has 'type' column
        await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS type TEXT`;

        // 1. Create Tables
        await sql`CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            location TEXT NOT NULL,
            type TEXT,
            beds INTEGER NOT NULL,
            baths INTEGER NOT NULL,
            list_nightly_rate REAL NOT NULL,
            amenities TEXT NOT NULL,
            metadata TEXT,
            images TEXT,
            created_at TEXT NOT NULL
        )`;

        await sql`CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            host_id TEXT DEFAULT 'demo_host_001',
            prop_id TEXT NOT NULL,
            arrival_date TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            nights INTEGER NOT NULL,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guests INTEGER NOT NULL DEFAULT 1,
            base_nightly_rate REAL NOT NULL,
            total_paid REAL NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at TEXT NOT NULL
        )`;

        await sql`CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            booking_id TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'active',
            top3 TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            email_subject TEXT,
            email_body_html TEXT,
            created_at TEXT NOT NULL
        )`;

        await sql`CREATE TABLE IF NOT EXISTS host_settings (
            host_id TEXT NOT NULL,
            session_id TEXT NOT NULL DEFAULT '',
            host_name TEXT,
            pm_company_name TEXT,
            min_revenue_lift_eur_per_night REAL DEFAULT 30.00,
            max_discount_pct REAL DEFAULT 0.40,
            min_adr_ratio REAL DEFAULT 1.15,
            max_adr_multiplier REAL DEFAULT 3.0,
            channel_fee_pct REAL DEFAULT 0.15,
            change_fee_eur REAL DEFAULT 50.00,
            use_openai_for_copy BOOLEAN DEFAULT FALSE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (host_id, session_id)
        )`;

        // 3. Load Data from JSON files
        const fs = require('fs');
        const path = require('path');

        const propertiesPath = path.join(process.cwd(), '..', 'initial_data', 'json', 'properties.json');
        const bookingsPath = path.join(process.cwd(), '..', 'initial_data', 'json', 'bookings.json');

        const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
        const bookingsData = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));

        const now = new Date().toISOString();

        // Seed Properties
        console.log(`Seeding ${propertiesData.length} properties...`);
        for (const p of propertiesData) {
            const locationStr = `${p.location.city}, ${p.location.country}`;
            const imagePath = `/properties/${p.id}.png`;
            await sql`INSERT INTO properties (id, name, location, type, beds, baths, list_nightly_rate, amenities, images, created_at)
                VALUES (${p.id}, ${p.name}, ${locationStr}, ${p.type}, ${p.beds}, ${p.baths}, ${p.rackRatePerNight || p.price}, ${JSON.stringify(p.amenities)}, ${JSON.stringify([imagePath])}, ${now})
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    location = EXCLUDED.location, 
                    type = EXCLUDED.type,
                    beds = EXCLUDED.beds, 
                    baths = EXCLUDED.baths, 
                    list_nightly_rate = EXCLUDED.list_nightly_rate,
                    amenities = EXCLUDED.amenities,
                    images = EXCLUDED.images`;
        }

        // Seed Bookings
        console.log(`Seeding bookings... Session: ${sessionId || 'Global'}`);

        // If sessionId is provided, delete existing for this session first
        if (sessionId) {
            await sql`DELETE FROM bookings WHERE session_id = ${sessionId}`;
            await sql`DELETE FROM offers WHERE session_id = ${sessionId}`;
            await sql`DELETE FROM host_settings WHERE session_id = ${sessionId}`;
        }

        const oneDayMs = 1000 * 60 * 60 * 24;
        const today = new Date();

        // Helper for short unique IDs
        const generateShortId = (prefix: string) => {
            return `${prefix}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        };

        for (const b of bookingsData) {
            let arrivalDate = b.arrival_date;
            let departureDate = b.departure_date;

            // Dynamic date calculation
            if (b.days_out !== undefined && b.days_out !== null) {
                const arrival = new Date(today.getTime() + (b.days_out * oneDayMs));
                const departure = new Date(arrival.getTime() + (b.nights * oneDayMs));
                arrivalDate = arrival.toISOString().split('T')[0];
                departureDate = departure.toISOString().split('T')[0];
            } else if (!arrivalDate) {
                // Fallback if no days_out and no arrival_date (shouldn't happen with normalized data)
                continue;
            }

            // Generate a fresh unique short ID
            const bookingId = generateShortId('res');

            await sql`INSERT INTO bookings (id, session_id, prop_id, arrival_date, departure_date, nights, guest_name, guest_email, guests, base_nightly_rate, total_paid, created_at, status)
                VALUES (${bookingId}, ${sessionId || null}, ${b.prop_id}, ${arrivalDate}, ${departureDate}, ${b.nights}, ${b.guest_name}, ${b.guest_email}, ${b.guests || 1}, ${b.base_nightly_rate}, ${b.total_paid}, ${now}, 'confirmed')`;
        }

        // Host Settings
        // Global settings (always present)
        await sql`INSERT INTO host_settings (
            host_id, session_id, host_name, pm_company_name, 
            max_discount_pct, min_revenue_lift_eur_per_night,
            min_adr_ratio, max_adr_multiplier, channel_fee_pct, change_fee_eur,
            use_openai_for_copy, created_at, updated_at
        )
        VALUES (
            'demo_host_001', '', 'Premium Property Management', 'Premium Stays',
            0.40, 30.00, 1.15, 3.0, 0.15, 50.00,
            TRUE, ${now}, ${now}
        )
        ON CONFLICT (host_id, session_id) DO NOTHING`;

        // Session-scoped settings (if sessionId provided)
        if (sessionId) {
            await sql`INSERT INTO host_settings (
                host_id, session_id, host_name, pm_company_name,
                max_discount_pct, min_revenue_lift_eur_per_night,
                min_adr_ratio, max_adr_multiplier, channel_fee_pct, change_fee_eur,
                use_openai_for_copy, created_at, updated_at
            )
            VALUES (
                'demo_host_001', ${sessionId}, 'Premium Property Management', 'Premium Stays',
                0.40, 30.00, 1.15, 3.0, 0.15, 50.00,
                TRUE, ${now}, ${now}
            )
            ON CONFLICT (host_id, session_id) DO UPDATE SET
                host_name = EXCLUDED.host_name,
                pm_company_name = EXCLUDED.pm_company_name,
                max_discount_pct = EXCLUDED.max_discount_pct,
                updated_at = EXCLUDED.updated_at`;
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Database initialized and seeded from JSON files',
            stats: {
                properties: propertiesData.length,
                bookings: bookingsData.length
            }
        });
    } catch (e: any) {
        console.error('Seed Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
