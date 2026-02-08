import { db } from '../db';
import { Booking, Property, Offer, UpgradeOption, PricingDetails, HostSettings } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import * as sgMail from '@sendgrid/mail';
import React from 'react';

import { EasyRenderer } from '../../components/EasyRenderer';
import { getOfferContext, defaultTemplate, getAcceptanceContext, defaultAcceptanceTemplate } from '../templateUtils';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function generateOffer(bookingId: string, sessionId?: string): Promise<string | null> {
    console.log(`\n=== Starting TS offer generation for booking ${bookingId} (Session: ${sessionId || 'None'}) ===`);

    const booking = await db.getBooking(bookingId, sessionId);
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
            hostSettings?.max_discount_pct ?? 0.45,
            booking.total_paid,
            hostSettings?.min_revenue_lift_eur_per_night ?? 15.00
        );

        const diffs = generatePropertyDiffs(originalProp, candidate);
        const candidateImages = parseImages(candidate.images);
        const images = candidateImages.length > 0 ? candidateImages : [`/properties/${candidate.id}.png`];

        scoredOptions.push({
            ranking: 0,
            prop_id: candidate.id,
            prop_name: candidate.name,
            viability_score: score,
            pricing,
            diffs,
            headline: `Upgrade to ${candidate.name}`,
            summary: `Experience more space and better amenities.`,
            images: images,
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
                aiCopy = await generateAICopy(originalProp, candidate, opt.pricing, booking, opt.diffs, hostSettings);
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
    const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://uprez.dpitcock.dev').replace(/\/$/, '');
    const offerUrl = `${baseUrl}/offer/${offerId}`;
    const companyName = hostSettings?.pm_company_name || hostSettings?.host_name || 'Your Host';

    // Ensure we have a valid image URL for the email
    const mainImage = bestOption.images?.[0];
    const imageUrl = mainImage
        ? (mainImage.startsWith('http') ? mainImage : `${baseUrl}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`)
        : `${baseUrl}/properties/${bestOption.prop_id}.png`;

    // Calculate per-night upgrade fee
    const upgradePerNight = Math.round(bestOption.pricing.revenue_lift / bestOption.pricing.nights);

    const expiresStr = `${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const context = getOfferContext({ id: offerId, expires_at: expiresAt.toISOString() } as Offer, booking, top3);
    // @ts-ignore - Dynamic require to avoid build errors in Next.js App Router
    const { renderToStaticMarkup } = require('react-dom/server');
    const emailHtml = renderToStaticMarkup(
        React.createElement(EasyRenderer, {
            templateJson: defaultTemplate,
            mode: 'email',
            data: context
        })
    );

    const offer: Partial<Offer> = {
        id: offerId,
        booking_id: bookingId,
        status: 'active',
        top3,
        expires_at: expiresAt.toISOString(),
        email_subject: bestOption.ai_copy?.subject || `Exclusive Upgrade Opportunity: ${bestOption.prop_name}`,
        email_body_html: emailHtml,
        created_at: new Date().toISOString()
    };

    console.log(`💾 Saving offer ${offerId} to database...`);
    await db.saveOffer(offer, sessionId);

    // Trigger email
    const recipient = process.env.CONTACT_EMAIL || booking.guest_email;
    console.log(`📧 Attempting to send email to ${recipient}...`);
    await sendOfferEmail(offer as Offer, booking);

    return offerId;
}

export async function generateOptionCopy(offerId: string, propId: string, sessionId?: string): Promise<any> {
    console.log(`\n=== Generating on-demand copy for offer ${offerId}, property ${propId} ===`);

    const offer = await db.getOffer(offerId); // Offer ID is unique UUID, so no session scoping needed for lookup?
    // Wait, getOffer does strictly ID lookup.
    // If offer ID is UUID, it's globally unique.
    if (!offer) throw new Error('Offer not found');

    const booking = await db.getBooking(offer.booking_id, sessionId);
    if (!booking) throw new Error('Booking not found');

    const originalProp = await db.getProperty(booking.prop_id);
    if (!originalProp) throw new Error('Original property not found');

    const top3 = offer.top3 as UpgradeOption[];
    const optionIndex = top3.findIndex(o => o.prop_id === propId);
    if (optionIndex === -1) throw new Error('Option not found in offer');

    const option = top3[optionIndex];
    const candidateProp = await db.getProperty(propId);
    if (!candidateProp) throw new Error('Candidate property not found');

    const hostSettings = await db.getHostSettings(booking.host_id || 'demo_host_001');

    // Generate AI copy with host settings context if available
    const aiCopy = await generateAICopy(originalProp, candidateProp, option.pricing, booking, option.diffs, hostSettings);

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
    }, sessionId);

    console.log(`✅ On-demand copy generated and saved for ${propId}`);
    return aiCopy;
}

export async function acceptOffer(offerId: string, propId: string, sessionId?: string): Promise<any> {
    console.log(`\n=== Accepting offer ${offerId}, property ${propId} ===`);

    const offer = await db.getOffer(offerId);
    if (!offer) throw new Error('Offer not found');
    if (offer.status !== 'active') throw new Error(`Offer is already ${offer.status}`);

    const booking = await db.getBooking(offer.booking_id, sessionId);
    if (!booking) throw new Error('Booking not found');

    const hostSettings = await db.getHostSettings(booking.host_id || 'demo_host_001');

    const top3 = offer.top3 as UpgradeOption[];
    const option = top3.find(o => o.prop_id === propId);
    if (!option) throw new Error('Selected property not found in offer options');

    // 1. Update Offer Status
    await db.updateOfferStatus(offerId, 'accepted', propId);

    // 2. Update Booking
    await db.updateBooking(offer.booking_id, {
        prop_id: propId,
        status: 'upgraded',
        upgraded_from_prop_id: booking.prop_id,
        base_nightly_rate: option.pricing.offer_adr,
        total_paid: option.pricing.offer_total,
        upgrade_at: new Date().toISOString()
    });

    // 3. Expire all other active offers for the same property
    // This prevents double-booking when multiple guests are offered the same upgrade
    try {
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.POSTGRES_URL!);

        const result = await sql`
            UPDATE offers 
            SET status = 'expired', updated_at = ${new Date().toISOString()}
            WHERE status = 'active' 
            AND id != ${offerId}
            AND top3::text LIKE ${`%"prop_id":"${propId}"%`}
        `;

        const expiredCount = result.length || 0;
        if (expiredCount > 0) {
            console.log(`🚫 Expired ${expiredCount} other active offer(s) for property ${propId}`);
        }
    } catch (err) {
        console.error('⚠️ Failed to expire competing offers:', err);
        // Don't fail the acceptance if this step fails - log and continue
    }

    // 4. Send Confirmation Email
    try {
        await sendAcceptanceEmail(booking, option, hostSettings);
    } catch (err) {
        console.error('⚠️ Failed to send acceptance email:', err);
    }

    console.log(`✅ Offer ${offerId} accepted. Booking ${offer.booking_id} updated to property ${propId}.`);

    return {
        success: true,
        message: 'Upgrade successful',
        booking_id: offer.booking_id
    };
}

export function computeScore(orig: Property, cand: Property, booking: Booking): number {
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

export function calculateOfferPricing(
    fromAdr: number,
    toAdr: number,
    nights: number,
    maxDiscountPct: number,
    fromTotal: number,
    minLiftPerNight: number = 15
): PricingDetails {
    const stayTotalAtListRate = toAdr * nights;
    const currentTotal = fromTotal;

    // The maximum possible lift (rack rate difference)
    const rawTotalDifference = stayTotalAtListRate - currentTotal;
    const rawLiftPerNight = rawTotalDifference / nights;

    // Apply the configured discount
    const discountedLiftPerNight = rawLiftPerNight * (1 - maxDiscountPct);

    // Guardrail: Ensure we don't go below minLiftPerNight, 
    // but also don't exceed the raw difference (don't charge more than rack rate)
    const finalLiftPerNight = Math.max(
        discountedLiftPerNight,
        Math.min(rawLiftPerNight, minLiftPerNight)
    );

    const upgradeFeeTotal = finalLiftPerNight * nights;
    const offerTotal = currentTotal + upgradeFeeTotal;
    const offerAdr = offerTotal / nights;

    // Calculate effective discount percentage for the UI
    const totalDiscountAmount = Math.max(0, stayTotalAtListRate - offerTotal);
    const effectiveDiscountPercent = stayTotalAtListRate > 0
        ? Math.round((totalDiscountAmount / stayTotalAtListRate) * 100)
        : 0;

    return {
        currency: 'EUR',
        from_adr: fromAdr,
        to_adr_list: toAdr,
        offer_adr: offerAdr,
        nights,
        from_total: fromTotal,
        offer_total: offerTotal,
        list_total: stayTotalAtListRate,
        discount_percent: effectiveDiscountPercent,
        discount_amount_total: totalDiscountAmount,
        revenue_lift: upgradeFeeTotal
    };
}

export function generatePropertyDiffs(orig: Property, cand: Property): string[] {
    const diffs: string[] = [];
    if (cand.beds > orig.beds) diffs.push(`${cand.beds - orig.beds} Extra Bedroom(s)`);
    if (cand.baths > orig.baths) diffs.push(`Additional Bathroom`);
    // Add more logic here as needed
    return diffs.slice(0, 3);
}

async function generateAICopy(orig: Property, cand: Property, pricing: PricingDetails, booking: Booking, diffs: string[], hostSettings?: HostSettings | null) {
    const companyName = hostSettings?.pm_company_name || hostSettings?.host_name || 'your host';
    const upgradePerNight = Math.round(pricing.revenue_lift / pricing.nights);

    const prompt = `Generate a luxury upgrade offer for ${booking.guest_name} from ${companyName}. 
    
    Original property: ${orig.name} at ${pricing.from_adr}€/night (Total paid: €${pricing.from_total})
    Upgrade property: ${cand.name} at ${pricing.to_adr_list}€/night list rate
    
    PRICING (IMPORTANT):
    - Upgrade fee: €${upgradePerNight}/night (€${pricing.revenue_lift} total for ${pricing.nights} nights)
    - This is the ADDITIONAL cost to upgrade, not the new total price
    - Display as: "Upgrade for just €${upgradePerNight}/night" or similar language that emphasizes the incremental cost
    
    Property differences: ${diffs.join(', ')}.
    
    Return JSON with the following structure:
    { 
      "subject": "Email subject line", 
      "email_title": "Primary greeting/title in the email (e.g. Great news, [Name]!)",
      "email_content": "A short, persuasive paragraph about why this upgrade is perfect for them.",
      "email_selling_points": ["Point 1", "Point 2", "Point 3"],
      "email_cta": "CTA Button text (e.g. VIEW MY UPGRADE)",
      "landing_hero": "Hero headline for the webpage", 
      "landing_summary": "Summary text for the webpage", 
      "diff_bullets": ["Bullet 1", "Bullet 2", "Bullet 3"] 
    }`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "You are a luxury concierge content generator." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
}

async function sendAcceptanceEmail(booking: Booking, option: UpgradeOption, hostSettings: HostSettings | null) {
    if (process.env.EMAIL_ENABLED !== 'true') return;

    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SENDGRID_API_KEY is missing (Acceptance Email)');
        return;
    }

    const recipient = process.env.CONTACT_EMAIL || booking.guest_email;
    const companyName = hostSettings?.pm_company_name || hostSettings?.host_name || 'Your Host';

    const context = getAcceptanceContext(booking, option, hostSettings);
    // @ts-ignore
    const { renderToStaticMarkup } = require('react-dom/server');
    const emailHtml = renderToStaticMarkup(
        React.createElement(EasyRenderer, {
            templateJson: defaultAcceptanceTemplate,
            mode: 'email',
            data: context
        })
    );

    const msg = {
        to: recipient,
        from: process.env.SENDGRID_FROM_EMAIL || 'dpitcock.dev@gmail.com',
        subject: `Upgrade Confirmed: ${option.prop_name}`,
        text: `Hi ${booking.guest_name}, Great news! Your upgrade to ${option.prop_name} has been confirmed. Total Paid: €${option.pricing.offer_total}. Dates: ${new Date(booking.arrival_date).toLocaleDateString()} - ${new Date(booking.departure_date).toLocaleDateString()}. Best, ${companyName}`,
        html: emailHtml
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Acceptance email sent to ${recipient}`);
    } catch (error: any) {
        console.error('❌ SendGrid Error (Acceptance):', error.response?.body || error.message);
    }
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

    // @ts-ignore
    const { renderToStaticMarkup } = require('react-dom/server');
    const emailHtml = renderToStaticMarkup(
        React.createElement(EasyRenderer, {
            templateJson: {
                root: {
                    children: [
                        {
                            component: 'Hero',
                            props: {
                                headline: 'UpRez Integration Active',
                                subheadline: 'If you see this, your SendGrid configuration is correct.'
                            }
                        }
                    ]
                }
            },
            mode: 'email',
            data: {}
        })
    );

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'dpitcock.dev@gmail.com',
        subject: 'UpRez Integration Test',
        html: emailHtml
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



