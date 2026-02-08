import { NextResponse } from 'next/server';

export async function GET() {
    // Mocked templates for the Host Settings UI
    const templates = [
        {
            template_id: 'email_modern_v1',
            template_name: 'Modern Upgrade Notification',
            template_type: 'email',
            preview_url: '/previews/email_v1.png'
        },
        {
            template_id: 'email_minimal_v1',
            template_name: 'Minimalist Text',
            template_type: 'email',
            preview_url: '/previews/email_v2.png'
        },
        {
            template_id: 'landing_dynamic_showcase',
            template_name: 'Dynamic Property Showcase',
            template_type: 'landing',
            preview_url: '/previews/landing_v1.png'
        },
        {
            template_id: 'landing_premium_dark',
            template_name: 'Premium Dark Mode',
            template_type: 'landing',
            preview_url: '/previews/landing_v2.png'
        }
    ];

    return NextResponse.json(templates);
}
