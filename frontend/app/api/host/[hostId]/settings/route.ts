import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;

        // Perform on-demand migration for new columns
        try {
            const { neon } = require('@neondatabase/serverless');
            const sql = neon(process.env.POSTGRES_URL!);
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS host_phone TEXT`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS pm_company_name TEXT`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS active_email_template_id TEXT`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS active_landing_template_id TEXT`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS max_distance_to_beach_m INTEGER DEFAULT 600`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS offer_validity_hours INTEGER DEFAULT 24`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS use_openai_for_copy BOOLEAN DEFAULT TRUE`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS offers_sent_this_month INTEGER DEFAULT 0`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS revenue_lifted_this_month REAL DEFAULT 0`;
            await sql`ALTER TABLE host_settings ADD COLUMN IF NOT EXISTS updated_at TEXT`;
        } catch (migErr) {
            console.error('On-demand migration failed:', migErr);
        }

        const settings = await db.getHostSettings(hostId, sessionId);
        if (!settings) {
            // Return defaults if not found (for demo resilience)
            return NextResponse.json({
                host_id: hostId,
                host_name: 'Premium Property Management',
                host_phone: '+34 600 000 000',
                pm_company_name: 'Premium Stays',
                min_revenue_lift_eur_per_night: 15,
                max_discount_pct: 0.45,
                min_adr_ratio: 1.05,
                max_adr_multiplier: 2.5,
                channel_fee_pct: 0.15,
                change_fee_eur: 30,
                active_email_template_id: null,
                active_landing_template_id: null,
                use_openai_for_copy: true,
                max_distance_to_beach_m: 600,
                offer_validity_hours: 24,
                offers_sent_this_month: 0,
                revenue_lifted_this_month: 0
            });
        }
        return NextResponse.json(settings);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;
        const updates = await req.json();

        // Validate max_discount_pct
        if (typeof updates.max_discount_pct === 'number') {
            if (updates.max_discount_pct < 0 || updates.max_discount_pct > 1) {
                return NextResponse.json({ error: 'max_discount_pct must be between 0 and 1' }, { status: 400 });
            }
        }

        // Merge with hostId to ensure it's set
        const settingsToSave = {
            ...updates,
            host_id: hostId
        };

        await db.saveHostSettings(settingsToSave, sessionId);

        // Fetch and return updated settings
        const updatedSettings = await db.getHostSettings(hostId, sessionId);
        return NextResponse.json(updatedSettings);
    } catch (e: any) {
        console.error('Settings PATCH error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
