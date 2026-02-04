import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/services/offerService';

/**
 * Diagnostic endpoint to test SendGrid configuration
 * Usage: GET /api/demo/test-email?to=your-email@example.com
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const to = searchParams.get('to') || process.env.CONTACT_EMAIL;

        if (!to) {
            return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
        }

        await sendTestEmail(to);

        return NextResponse.json({
            status: 'ok',
            message: `Test email sent to ${to}`,
            config: {
                from: process.env.SENDGRID_FROM_EMAIL,
                enabled: process.env.EMAIL_ENABLED,
                hasKey: !!process.env.SENDGRID_API_KEY
            }
        });
    } catch (e: any) {
        console.error('Test Email API Error:', e);
        return NextResponse.json({
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
    }
}
