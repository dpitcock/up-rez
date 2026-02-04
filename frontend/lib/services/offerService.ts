import { db } from '../db';
import { Booking, Property, Offer, UpgradeOption, PricingDetails, HostSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import * as sgMail from '@sendgrid/mail';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function generateOffer(bookingId: string): Promise<string | null> {
    console.log(`\n=== Starting TS offer generation for booking ${bookingId} ===`);

    const booking = await db.getBooking(bookingId);
    if (!booking) {
        console.error(`❌ Booking ${bookingId} not found`);
        return null;
    }

    const originalProp = await db.getProperty(booking.prop_id);
    if (!originalProp) {
        console.error(`❌ Property ${booking.prop_id} not found`);
        return null;
    }

    const hostSettings = await db.getHostSettings(booking.host_id || 'demo_host_001');
    const useOpenAI = process.env.NEXT_PUBLIC_USE_OPENAI === 'true' || hostSettings?.use_openai_for_copy;

    // 1. Initial Filtering & Scoring
    const allProperties = await db.getAllProperties();
    const candidates = allProperties.filter(p => p.id !== booking.prop_id);

    console.log(`Analyzing ${candidates.length} candidates for booking ${bookingId}`);

    const scoredOptions: UpgradeOption[] = [];

    for (const candidate of candidates) {
        // Basic eligibility check
        if (candidate.beds < originalProp.beds) continue; // Don't offer smaller places

        const score = computeScore(originalProp, candidate, booking);

        const pricing = calculateOfferPricing(
            booking.base_nightly_rate,
            candidate.list_nightly_rate,
            booking.nights,
            hostSettings?.max_discount_pct || 0.40,
            booking.total_paid
        );

        const diffs = generatePropertyDiffs(originalProp, candidate);

        scoredOptions.push({
            ranking: 0,
            prop_id: candidate.id,
            prop_name: candidate.name,
            viability_score: score,
            pricing,
            diffs,
            headline: `Upgrade to ${candidate.name}`,
            summary: `Experience more space and better amenities.`,
            images: parseImages(candidate.images),
            ai_copy: null,
            amenities: parseAmenities(candidate.amenities),
            metadata: candidate.metadata || {},
            availability: { status: 'available' }
        });
    }

    // Sort by score and take top 3
    const topCandidates = scoredOptions
        .sort((a, b) => b.viability_score - a.viability_score)
        .slice(0, 3);

    if (topCandidates.length === 0) {
        console.warn(`⚠️ No suitable upgrade options found for booking ${bookingId}`);
        return null;
    }

    // 2. Generate AI Copy only for the #1 pick
    console.log(`Generating AI copy for the best candidate: ${topCandidates[0].prop_name}...`);
    const top3 = await Promise.all(topCandidates.map(async (opt, idx) => {
        let aiCopy = null;
        // Only generate AI copy for the top one to be fast and reliable
        if (useOpenAI && idx === 0) {
            try {
                const candidate = allProperties.find(p => p.id === opt.prop_id)!;
                aiCopy = await generateAICopy(originalProp, candidate, opt.pricing, booking, opt.diffs);
                console.log(`✅ AI Copy generated for ${opt.prop_name}`);
            } catch (err) {
                console.error(`❌ AI Generation failed for ${opt.prop_name}:`, err);
            }
        }
        return {
            ...opt,
            ranking: idx + 1,
            ai_copy: aiCopy,
            headline: aiCopy?.landing_hero || opt.headline,
            summary: aiCopy?.landing_summary || opt.summary
        };
    }));

    const offerId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (hostSettings?.offer_validity_hours || 48));

    const bestOption = top3[0];
    const defaultSubject = `Exclusive Upgrade Opportunity: ${bestOption.prop_name}`;
    const defaultEmailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #EF6C00;">Great news, ${booking.guest_name}!</h2>
            <p>We have a special upgrade opportunity for your upcoming stay at <strong>${originalProp.name}</strong>.</p>
            <div style="background: #fff9f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${bestOption.prop_name}</h3>
                <p>${bestOption.summary}</p>
                <ul>
                    ${bestOption.diffs.map(d => `<li>${d}</li>`).join('')}
                </ul>
                <p><strong>Offer Price:</strong> €${bestOption.pricing.offer_adr.toFixed(2)}/night</p>
            </div>
            <p>Click below to view the full details and claim your upgrade:</p>
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/offer/${offerId}" 
               style="display: inline-block; background: #EF6C00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               View My Upgrade Offer
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
                This offer expires on ${new Date(expiresAt).toLocaleDateString()}.
            </p>
        </div>
    `;

    const offer: Partial<Offer> = {
        id: offerId,
        booking_id: bookingId,
        status: 'active',
        top3,
        expires_at: expiresAt.toISOString(),
        email_subject: bestOption.ai_copy?.subject || defaultSubject,
        email_body_html: bestOption.ai_copy?.email_html || defaultEmailHtml,
        created_at: new Date().toISOString()
    };

    console.log(`💾 Saving offer ${offerId} to database...`);
    await db.saveOffer(offer);

    // Trigger email
    const recipient = process.env.CONTACT_EMAIL || booking.guest_email;
    console.log(`📧 Attempting to send email to ${recipient}...`);
    await sendOfferEmail(offer as Offer, booking);

    return offerId;
}

export async function generateOptionCopy(offerId: string, propId: string): Promise<any> {
    console.log(`\n=== Generating on-demand copy for offer ${offerId}, property ${propId} ===`);

    const offer = await db.getOffer(offerId);
    if (!offer) throw new Error('Offer not found');

    const booking = await db.getBooking(offer.booking_id);
    if (!booking) throw new Error('Booking not found');

    const originalProp = await db.getProperty(booking.prop_id);
    if (!originalProp) throw new Error('Original property not found');

    const top3 = offer.top3 as UpgradeOption[];
    const optionIndex = top3.findIndex(o => o.prop_id === propId);
    if (optionIndex === -1) throw new Error('Option not found in offer');

    const option = top3[optionIndex];
    const candidateProp = await db.getProperty(propId);
    if (!candidateProp) throw new Error('Candidate property not found');

    // Generate AI copy
    const aiCopy = await generateAICopy(originalProp, candidateProp, option.pricing, booking, option.diffs);

    // Update the option in the list
    top3[optionIndex] = {
        ...option,
        ai_copy: aiCopy,
        headline: aiCopy.landing_hero || option.headline,
        summary: aiCopy.landing_summary || option.summary
    };

    // Update the offer in DB
    await db.saveOffer({
        ...offer,
        top3
    });

    console.log(`✅ On-demand copy generated and saved for ${propId}`);
    return aiCopy;
}

function computeScore(orig: Property, cand: Property, booking: Booking): number {
    let score = 5.0;

    // Better amenities
    if (cand.beds > orig.beds) score += 2.0;
    if (cand.baths > orig.baths) score += 1.0;

    // Location context (simulated)
    if (cand.location === orig.location) score += 1.0;

    // Price delta context
    const priceRatio = cand.list_nightly_rate / orig.list_nightly_rate;
    if (priceRatio > 1.1 && priceRatio < 2.5) score += 1.0;

    return Math.min(10, score);
}

function calculateOfferPricing(fromAdr: number, toAdr: number, nights: number, discountPct: number, fromTotal: number): PricingDetails {
    const offerAdr = fromAdr + (toAdr - fromAdr) * (1 - discountPct);
    const offerTotal = offerAdr * nights;
    const listTotal = toAdr * nights;

    return {
        currency: 'EUR',
        from_adr: fromAdr,
        to_adr_list: toAdr,
        offer_adr: offerAdr,
        nights,
        from_total: fromTotal,
        offer_total: offerTotal,
        list_total: listTotal,
        discount_percent: discountPct * 100,
        discount_amount_total: listTotal - offerTotal,
        revenue_lift: offerTotal - fromTotal
    };
}

function generatePropertyDiffs(orig: Property, cand: Property): string[] {
    const diffs: string[] = [];
    if (cand.beds > orig.beds) diffs.push(`${cand.beds - orig.beds} Extra Bedroom(s)`);
    if (cand.baths > orig.baths) diffs.push(`Additional Bathroom`);
    // Add more logic here as needed
    return diffs.slice(0, 3);
}

async function generateAICopy(orig: Property, cand: Property, pricing: PricingDetails, booking: Booking, diffs: string[]) {
    const prompt = `Generate a luxury upgrade offer for ${booking.guest_name}. 
    Original: ${orig.name} at ${pricing.from_adr}€/night.
    Upgrade: ${cand.name} at ${pricing.offer_adr}€/night (Discounted from ${pricing.to_adr_list}€).
    Diffs: ${diffs.join(', ')}.
    Return JSON: { "subject": "...", "email_html": "...", "landing_hero": "...", "landing_summary": "...", "diff_bullets": ["...", "...", "..."] }`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
}

async function sendOfferEmail(offer: Offer, booking: Booking) {
    if (process.env.EMAIL_ENABLED !== 'true') {
        console.log('ℹ️ Email sending is disabled (EMAIL_ENABLED != true)');
        return;
    }
    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SENDGRID_API_KEY is missing');
        return;
    }

    const recipient = process.env.CONTACT_EMAIL || booking.guest_email;

    const msg = {
        to: recipient,
        from: process.env.SENDGRID_FROM_EMAIL || 'dpitcock.dev@gmail.com',
        subject: offer.email_subject || 'Your Upgrade Offer',
        html: offer.email_body_html || '<p>Error loading content.</p>',
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Email sent to ${recipient} (Provider: SendGrid)`);
    } catch (error: any) {
        console.error('❌ SendGrid Error:', error.response?.body || error.message);
    }
}

/**
 * Diagnostic helper to test email integration directly
 */
export async function sendTestEmail(to: string) {
    console.log(`🚀 Sending test email to ${to}...`);

    if (process.env.EMAIL_ENABLED !== 'true') {
        throw new Error('Email is disabled in configuration');
    }

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'dpitcock.dev@gmail.com',
        subject: 'UpRez Integration Test',
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #EF6C00;">UpRez Integration Active</h1>
                <p>If you see this, your SendGrid configuration is correct.</p>
                <hr/>
                <p style="font-size: 12px; color: #666;">Time: ${new Date().toISOString()}</p>
            </div>
        `,
    };

    return sgMail.send(msg);
}

function parseImages(imgs: any): string[] {
    if (Array.isArray(imgs)) return imgs;
    if (typeof imgs === 'string') {
        try { return JSON.parse(imgs); } catch { return []; }
    }
    return [];
}

function parseAmenities(am: any): string[] {
    if (Array.isArray(am)) return am;
    if (typeof am === 'string') {
        try { return JSON.parse(am); } catch { return am.split(',').map(s => s.trim()); }
    }
    return [];
}
