import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function POST(req: NextRequest) {
    try {
        console.log('Running database migrations...');

        // Backup existing data from host_settings if it exists
        let existingData: any[] = [];
        try {
            existingData = await sql`SELECT * FROM host_settings`;
            console.log(`Found ${existingData.length} existing host_settings records`);
        } catch (e) {
            console.log('No existing host_settings table found');
        }

        // Drop and recreate the table with complete schema
        console.log('Recreating host_settings table with session_id support...');
        await sql`DROP TABLE IF EXISTS host_settings`;

        await sql`CREATE TABLE host_settings (
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

        // Restore data with empty string for session_id (global settings)
        for (const row of existingData) {
            await sql`INSERT INTO host_settings (
                host_id, session_id, host_name, pm_company_name,
                min_revenue_lift_eur_per_night, max_discount_pct,
                min_adr_ratio, max_adr_multiplier,
                channel_fee_pct, change_fee_eur,
                use_openai_for_copy, created_at, updated_at
            ) VALUES (
                ${row.host_id}, '', ${row.host_name}, ${row.pm_company_name || row.host_name},
                ${row.min_revenue_lift_eur_per_night || 30.00}, ${row.max_discount_pct || 0.40},
                ${row.min_adr_ratio || 1.15}, ${row.max_adr_multiplier || 3.0},
                ${row.channel_fee_pct || 0.15}, ${row.change_fee_eur || 50.00},
                ${row.use_openai_for_copy || false}, ${row.created_at}, ${row.updated_at}
            )`;
        }

        console.log('✅ Migration complete: host_settings table recreated with full schema');

        return NextResponse.json({
            success: true,
            message: 'Database migrations completed successfully',
            recordsRestored: existingData.length
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error
        }, { status: 500 });
    }
}
