import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ hostId: string }> }
) {
    try {
        const { hostId } = await context.params;
        const sessionId = req.headers.get('x-session-id') || undefined;
        const now = new Date().toISOString();

        // Reset to default settings
        const defaultSettings = {
            host_id: hostId,
            session_id: sessionId || null,
            host_name: 'Premium Property Management',
            pm_company_name: 'Premium Stays',
            min_revenue_lift_eur_per_night: 30.00,
            max_discount_pct: 0.40,
            min_adr_ratio: 1.15,
            max_adr_multiplier: 3.0,
            channel_fee_pct: 0.15,
            change_fee_eur: 50.00,
            use_openai_for_copy: true
        };

        await sql`
            INSERT INTO host_settings (
                host_id, session_id, host_name, pm_company_name,
                min_revenue_lift_eur_per_night, max_discount_pct,
                min_adr_ratio, max_adr_multiplier,
                channel_fee_pct, change_fee_eur,
                use_openai_for_copy, created_at, updated_at
            )
            VALUES (
                ${defaultSettings.host_id}, ${defaultSettings.session_id},
                ${defaultSettings.host_name}, ${defaultSettings.pm_company_name},
                ${defaultSettings.min_revenue_lift_eur_per_night}, ${defaultSettings.max_discount_pct},
                ${defaultSettings.min_adr_ratio}, ${defaultSettings.max_adr_multiplier},
                ${defaultSettings.channel_fee_pct}, ${defaultSettings.change_fee_eur},
                ${defaultSettings.use_openai_for_copy}, ${now}, ${now}
            )
            ON CONFLICT (host_id, session_id) DO UPDATE SET
                host_name = EXCLUDED.host_name,
                pm_company_name = EXCLUDED.pm_company_name,
                min_revenue_lift_eur_per_night = EXCLUDED.min_revenue_lift_eur_per_night,
                max_discount_pct = EXCLUDED.max_discount_pct,
                min_adr_ratio = EXCLUDED.min_adr_ratio,
                max_adr_multiplier = EXCLUDED.max_adr_multiplier,
                channel_fee_pct = EXCLUDED.channel_fee_pct,
                change_fee_eur = EXCLUDED.change_fee_eur,
                use_openai_for_copy = EXCLUDED.use_openai_for_copy,
                updated_at = EXCLUDED.updated_at
        `;

        return NextResponse.json({ message: 'Settings reset to defaults', settings: defaultSettings });
    } catch (e: any) {
        console.error('Settings reset error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
