import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
    try {
        // 1. Create Tables
        await sql`CREATE TABLE IF NOT EXISTS properties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            location TEXT NOT NULL,
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
            host_id TEXT DEFAULT 'demo_host_001',
            prop_id TEXT NOT NULL,
            arrival_date TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            nights INTEGER NOT NULL,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            base_nightly_rate REAL NOT NULL,
            total_paid REAL NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at TEXT NOT NULL
        )`;

        await sql`CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            booking_id TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'active',
            top3 TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            email_subject TEXT,
            email_body_html TEXT,
            created_at TEXT NOT NULL
        )`;

        await sql`CREATE TABLE IF NOT EXISTS host_settings (
            host_id TEXT PRIMARY KEY,
            host_name TEXT,
            pm_company_name TEXT,
            min_revenue_lift_eur_per_night REAL DEFAULT 30.00,
            max_discount_pct REAL DEFAULT 0.40,
            use_openai_for_copy BOOLEAN DEFAULT FALSE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )`;

        // 3. Load Data from JSON files
        const fs = require('fs');
        const path = require('path');

        const propertiesPath = path.join(process.cwd(), '..', 'initial_data', 'properties.json');
        const bookingsPath = path.join(process.cwd(), '..', 'initial_data', 'bookings.json');

        const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
        const bookingsData = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));

        const now = new Date().toISOString();

        // Seed Properties
        console.log(`Seeding ${propertiesData.length} properties...`);
        for (const p of propertiesData) {
            const locationStr = `${p.location.city}, ${p.location.country}`;
            await sql`INSERT INTO properties (id, name, location, beds, baths, list_nightly_rate, amenities, created_at)
                VALUES (${p.id}, ${p.name}, ${locationStr}, ${p.beds}, ${p.baths}, ${p.rackRatePerNight || p.price}, ${JSON.stringify(p.amenities)}, ${now})
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    location = EXCLUDED.location, 
                    beds = EXCLUDED.beds, 
                    baths = EXCLUDED.baths, 
                    list_nightly_rate = EXCLUDED.list_nightly_rate,
                    amenities = EXCLUDED.amenities`;
        }

        // Seed Bookings
        console.log(`Seeding ${bookingsData.length} bookings...`);
        for (const b of bookingsData) {
            await sql`INSERT INTO bookings (id, prop_id, arrival_date, departure_date, nights, guest_name, guest_email, base_nightly_rate, total_paid, created_at, status)
                VALUES (${b.id}, ${b.prop_id}, ${b.arrival_date}, ${b.departure_date}, ${b.nights}, ${b.guest_name}, ${b.guest_email}, ${b.base_nightly_rate}, ${b.total_paid}, ${now}, 'confirmed')
                ON CONFLICT (id) DO UPDATE SET 
                    status = 'confirmed',
                    prop_id = EXCLUDED.prop_id`;
        }

        // Host Settings
        await sql`INSERT INTO host_settings (host_id, pm_company_name, use_openai_for_copy, created_at, updated_at)
            VALUES ('demo_host_001', 'Premium Stays', TRUE, ${now}, ${now})
            ON CONFLICT (host_id) DO NOTHING`;

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
