// Simple template processor regex
export function processTemplate(text: string, data: Record<string, any>): string {
    if (typeof text !== 'string') return text;
    return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const val = data[key.trim()];
        return val !== undefined ? String(val) : match;
    });
}

export function processProps(props: any, data: Record<string, any>): any {
    const newProps: any = {};
    for (const key in props) {
        if (typeof props[key] === 'string') {
            newProps[key] = processTemplate(props[key], data);
        } else if (Array.isArray(props[key])) {
            newProps[key] = props[key].map((item: any) =>
                typeof item === 'string' ? processTemplate(item, data) : item
            );
        } else {
            newProps[key] = props[key];
        }
    }
    return newProps;
}

export function getOfferContext(offer: any, booking: any, options: any[]) {
    const bestOption = options[0]; // Primary upgrade option
    if (!bestOption) return {};

    // Safety check for pricing
    const pricing = bestOption.pricing || { revenue_lift: 0, nights: 1, offer_total: 0, discount_percent: 0 };
    const upgradePerNight = Math.round(pricing.revenue_lift / pricing.nights);

    // Construct URLs
    const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://uprez.dpitcock.dev').replace(/\/$/, '');
    const offerUrl = `${baseUrl}/offer/${offer.id}`;

    // Ensure absolute image URL
    const mainImage = bestOption.images?.[0] || '';
    const propImage = mainImage.startsWith('http') ? mainImage : `${baseUrl}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`;

    return {
        guest_name: booking.guest_name || 'Guest',
        prop_name: bestOption.prop_name,
        prop_image: propImage,
        upgrade_fee_night: upgradePerNight,
        upgrade_fee_total: pricing.revenue_lift,
        offer_total: pricing.offer_total,
        discount_percent: pricing.discount_percent,
        expires_at: new Date(offer.expires_at).toLocaleString(),
        offer_url: offerUrl,

        // AI Content
        ai_headline: bestOption.ai_copy?.landing_hero || bestOption.headline || `Upgrade to ${bestOption.prop_name}`,
        ai_summary: bestOption.ai_copy?.landing_summary || bestOption.summary,
        ai_bullets: bestOption.ai_copy?.diff_bullets || bestOption.diffs || [],

        // Host Info
        company_name: 'Your Host' // TODO: wire up from settings
    };
}

export function getAcceptanceContext(booking: any, option: any, hostSettings: any) {
    const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://uprez.dpitcock.dev').replace(/\/$/, '');
    const companyName = hostSettings?.pm_company_name || hostSettings?.host_name || 'Your Host';

    return {
        guest_name: booking.guest_name || 'Guest',
        prop_name: option.prop_name,
        company_name: companyName,
        arrival_date: new Date(booking.arrival_date).toLocaleDateString(),
        departure_date: new Date(booking.departure_date).toLocaleDateString(),
        offer_total: option.pricing.offer_total,
        support_email: 'support@uprez.io'
    };
}

export const defaultTemplate = {
    root: {
        children: [
            {
                component: 'Hero',
                props: {
                    headline: '{{ai_headline}}',
                    subheadline: '{{ai_summary}}',
                    image: '{{prop_image}}'
                }
            },
            {
                component: 'AmenityCloud',
                props: {
                    items: '{{ai_bullets}}'
                }
            },
            {
                component: 'PricingCard',
                props: {
                    fee: '{{upgrade_fee_night}}',
                    cta_url: '{{offer_url}}'
                }
            }
        ]
    }
};

export const defaultAcceptanceTemplate = {
    root: {
        children: [
            {
                component: 'Hero',
                props: {
                    headline: 'Upgrade Confirmed!',
                    subheadline: 'Hi {{guest_name}}, your upgrade to {{prop_name}} is all set.'
                }
            },
            {
                component: 'PricingCard',
                props: {
                    fee: '{{offer_total}}',
                    cta_text: 'View Reservation',
                    cta_url: '#'
                }
            }
        ]
    }
};
