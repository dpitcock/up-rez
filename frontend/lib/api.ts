/**
 * API client for backend communication
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Instantiates a full offer object from a dateless template.
 */
function instantiateOfferFromTemplate(template: any, booking: any, demoData: any) {
    const offerId = `off_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const offerUrl = `${baseUrl}/offer/${offerId}`;

    // Replace placeholder in email body
    let emailBody = template.email_body_html || '';
    emailBody = emailBody.replace(/{OFFER_URL}/g, offerUrl)
        .replace(/{{OFFER_URL}}/g, offerUrl)
        .replace(/{{ OFFER_URL }}/g, offerUrl);

    // Map template data to real offer structure
    return {
        id: offerId,
        booking_id: booking.id,
        status: 'active',
        created_at: createdAt,
        expires_at: expiresAt,
        email_subject: template.email_subject,
        email_body_html: emailBody,
        original_booking: {
            guest_name: booking.guest_name,
            arrival_date: booking.arrival_date,
            departure_date: booking.departure_date,
            nights: booking.nights,
            prop_name: demoData.properties.find((p: any) => p.id === booking.prop_id)?.name || "Original Property",
            current_adr: booking.base_nightly_rate,
            current_total: booking.total_paid
        },
        options: template.top3.map((opt: any) => ({
            ...opt,
            // Re-calculate pricing if nights differ from template (optional, keeping it simple for now)
            pricing: {
                ...opt.pricing,
                total_extra: Math.round(opt.pricing.extra_per_night * booking.nights),
                offer_total: Math.round(opt.pricing.offer_adr * booking.nights)
            }
        }))
    };
}

/**
 * Shifts static dates to be relative to the current time.
 * Returns updated data with a new snapshot timestamp to prevent re-shifting.
 */
function normalizeDemoDates(data: any) {
    if (!data.metadata?.snapshot_at) return data;

    const snapshotDate = new Date(data.metadata.snapshot_at);
    const now = new Date();
    // Round to nearest day for consistency
    const diffMs = now.getTime() - snapshotDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return data;

    const shiftDate = (dateStr: string | null) => {
        if (!dateStr) return dateStr;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        d.setDate(d.getDate() + diffDays);

        // Return in same format
        if (dateStr.length === 10) return d.toISOString().split('T')[0]; // YYYY-MM-DD
        return d.toISOString();
    };

    // 1. Process Bookings
    if (data.bookings) {
        data.bookings = data.bookings.map((b: any) => ({
            ...b,
            arrival_date: shiftDate(b.arrival_date),
            departure_date: shiftDate(b.departure_date),
            created_at: shiftDate(b.created_at)
        }));
    }

    // 2. Process Offers
    if (data.offers) {
        Object.keys(data.offers).forEach(id => {
            const o = data.offers[id];
            o.expires_at = shiftDate(o.expires_at);
            o.created_at = shiftDate(o.created_at);
            if (o.original_booking) {
                o.original_booking.arrival_date = shiftDate(o.original_booking.arrival_date);
                o.original_booking.departure_date = shiftDate(o.original_booking.departure_date);
            }
        });
    }

    // Update metadata so we don't double-normalize next time
    data.metadata.snapshot_at = now.toISOString();

    return data;
}

/**
 * Robust fetcher with local fallback for Vercel/Static deployments
 */
export async function apiClient(path: string, options?: RequestInit) {
    const isClientOnly = process.env.NEXT_PUBLIC_DEMO_MODE === 'client_only';

    if (typeof window !== 'undefined' && (window as any)._api_debug) {
        console.debug(`[apiClient] ${options?.method || 'GET'} ${path} (clientOnly=${isClientOnly})`);
    }

    // Helper to get demo data from localStorage or fallback
    const getMockDB = async () => {
        if (typeof window === 'undefined') return null;

        const stored = localStorage.getItem('uprez_demo_db');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.bookings && parsed.properties) {
                    return parsed;
                }
                console.warn("[apiClient] Cached DB incomplete, re-fetching...");
            } catch (e) {
                console.error("[apiClient] Storage corruption, clearing...", e);
                localStorage.removeItem('uprez_demo_db');
            }
        }

        try {
            console.info("[apiClient] Initializing Standalone Mock DB from /demo-data.json...");
            const fallbackRes = await fetch('/demo-data.json');
            if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);

            let data = await fallbackRes.json();

            // Critical keys check
            if (!data.properties) data.properties = [];
            if (!data.bookings) data.bookings = [];
            if (!data.offers) data.offers = {};
            if (!data.host_settings) data.host_settings = { host_id: 'demo_host_001', pm_company_name: "@luxury_stays" };

            // Initial normalization for first-time load
            try {
                data = normalizeDemoDates(data);
            } catch (normErr) {
                console.warn("[apiClient] Date normalization failed", normErr);
            }

            // Seed initial offers from templates if none exist
            try {
                if (Object.keys(data.offers).length === 0 && data.offer_templates) {
                    const budgetBooking = data.bookings.find((b: any) => String(b.id).includes('budget'));
                    const budgetTemplate = data.offer_templates.find((t: any) => String(t.template_id).includes('budget_to_mid'));

                    if (budgetBooking && budgetTemplate) {
                        const offer = instantiateOfferFromTemplate(budgetTemplate, budgetBooking, data);
                        data.offers[offer.id] = offer;
                    }
                }
            } catch (seedErr) {
                console.warn("[apiClient] Seeding failed", seedErr);
            }

            localStorage.setItem('uprez_demo_db', JSON.stringify(data));
            console.info("[apiClient] Standalone DB Ready.");
            return data;
        } catch (e) {
            console.error("[apiClient] CRITICAL: Failed to load mockup data", e);
            return null;
        }
    };

    const saveMockDB = (data: any) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('uprez_demo_db', JSON.stringify(data));
        }
    };

    // If NOT in client_only mode, attempt real backend first
    if (!isClientOnly) {
        try {
            const response = await fetch(`${BACKEND_URL}${path}`, options);
            if (response.ok) return await response.json();
            console.warn(`Backend error on ${path}, checking local fallback...`);
        } catch (err) {
            console.warn(`Backend unreachable at ${path}, attempting local fallback...`, err);
        }
    } else {
        // Log once per session if possible, or just once in console
        if (typeof window !== 'undefined' && !(window as any)._mock_notified) {
            console.info("%c STANDALONE MOCK MODE ACTIVE ", "background: #ea580c; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px;");
            (window as any)._mock_notified = true;
        }
    }

    // CLIENT_ONLY MODE or BACKEND FALLBACK LOGIC
    const demoData = await getMockDB();
    if (!demoData) throw new Error("Local data pond unavailable");

    // --- MOCK ENDPOINTS ---

    // Special: Demo Controls
    if (path.includes('/demo/reset-data')) {
        if (typeof window !== 'undefined') localStorage.removeItem('uprez_demo_db');
        await getMockDB(); // Reload
        return { status: "ok", message: "Database reset to initial state (Local)" };
    }

    if (path.includes('/demo/normalize-dates')) {
        const normalized = normalizeDemoDates(demoData);
        saveMockDB(normalized);
        return { status: "ok", message: "Dates normalized relative to now (Local)" };
    }

    if (path.includes('/demo/frontend-build')) {
        return { status: "ok", message: "Frontend templates rebuilt (Simulated)" };
    }

    // --- BOT PROMPT BUILDER ---
    const buildClientBotPrompt = (offer: any, propId: string, question: string, history: any[]) => {
        const currentOption = offer.options?.find((o: any) => o.prop_id === propId) || offer.options?.[0];
        const orig = offer.original_booking;
        if (!currentOption || !orig) return question;

        const amenities = currentOption.diffs.join(', ');

        return `You are a strict luxury concierge. Answer ONLY using the CONTEXT below. 
CRITICAL: Distinguish between PRIVATE and SHARED facilities (especially pools). Never invent features.
If details are missing, say 'I don't have that specific detail' and pivot to a confirmed feature.

CONTEXT:
- Original: ${orig.prop_name}
- Upgrade: ${currentOption.prop_name}
- Upgrade Type: ${currentOption.type || 'Stay'}
- Price Delta: ONLY €${currentOption.pricing.extra_per_night}/nt extra
- Upgrade Features: ${amenities}
- View: ${currentOption.view || 'Standard'}

GUEST QUESTION: ${question}

RULE: 1-2 concise, factual sentences. No fluff.`;
    };

    // 1. CHATBOT MOCK
    if (path.includes('/bot/query')) {
        const useOpenAI = process.env.NEXT_PUBLIC_USE_OPENAI === 'true';

        if (useOpenAI && options?.body) {
            try {
                const { offer_id, prop_id, question, history } = JSON.parse(options.body as string);
                const offer = demoData.offers?.[offer_id];
                if (offer) {
                    const promptContext = buildClientBotPrompt(offer, prop_id, question, history);

                    // Call our SECURE internal API route (protects the API Key)
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            question,
                            history,
                            context: promptContext
                        })
                    });

                    const data = await res.json();
                    return {
                        answer: data.answer || "I'm processing that, one moment...",
                        sources: null
                    };
                }
            } catch (err) {
                console.error("Client-side Chat Route failed", err);
            }
        }

        return {
            answer: "Demo Mode: OpenAI tokens needed or Gemini Nano not detected. Please configure OPENAI_API_KEY on the server or enable Gemini Nano in Chrome for dynamic chat.",
            sources: null
        };
    }

    // 2. TRIGGER OFFER MOCK
    if (path.includes('/demo/trigger') || path.includes('/trigger/cron')) {
        let bookingId: string | null = null;
        try {
            if (options?.body) {
                const body = JSON.parse(options.body as string);
                bookingId = body.booking_id;
            } else if (path.includes('?')) {
                const params = new URLSearchParams(path.split('?')[1]);
                bookingId = params.get('booking_id');
            }
        } catch (e) { console.error("Body parse error", e); }

        const booking = demoData.bookings.find((b: any) => b.id === bookingId);

        if (booking) {
            // Find a matching template based on booking category
            const origProp = demoData.properties.find((p: any) => p.id === booking.prop_id);
            const category = origProp?.category || 'budget';

            let template = demoData.offer_templates?.find((t: any) =>
                t.template_id.toLowerCase().includes(category)
            ) || demoData.offer_templates?.[0];

            let newOffer;
            if (template) {
                newOffer = instantiateOfferFromTemplate(template, booking, demoData);
            } else {
                // Fallback to legacy manual generation if no templates
                const offerId = `off_${Math.random().toString(36).substr(2, 9)}`;
                newOffer = {
                    id: offerId,
                    booking_id: bookingId,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                    original_booking: {
                        guest_name: booking.guest_name,
                        arrival_date: booking.arrival_date,
                        departure_date: booking.departure_date,
                        nights: booking.nights,
                        prop_name: origProp?.name || "Original Property",
                        current_adr: booking.base_nightly_rate,
                        current_total: booking.total_paid
                    },
                    options: demoData.properties
                        .filter((p: any) => p.id !== booking.prop_id && p.list_nightly_rate > booking.base_nightly_rate)
                        .slice(0, 3)
                        .map((p: any) => ({
                            prop_id: p.id,
                            prop_name: p.name,
                            location: p.location,
                            images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
                            headline: "Luxury Awaits",
                            summary: `Upgrade to ${p.name} for an enhanced experience.`,
                            diffs: ["Plush Interior", "Better Views", "Premium Amenities"],
                            pricing: {
                                offer_adr: p.list_nightly_rate * 0.8,
                                extra_per_night: Math.round(p.list_nightly_rate * 0.8 - booking.base_nightly_rate),
                                total_extra: Math.round((p.list_nightly_rate * 0.8 - booking.base_nightly_rate) * booking.nights),
                                offer_total: Math.round(p.list_nightly_rate * 0.8 * booking.nights)
                            }
                        }))
                };
            }

            if (!demoData.offers) demoData.offers = {};
            demoData.offers[newOffer.id] = newOffer;
            saveMockDB(demoData);
            return { status: "ok", offer_id: newOffer.id, message: "Demo offer generated (Local)" };
        }
    }

    // 3. ACCEPT OFFER MOCK
    if (path.includes('/accept')) {
        return { success: true, confirmation_number: `DEMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}` };
    }

    // 4. GET ROUTES MOCK
    if (path.includes('/demo/status')) {
        return {
            status: "static_demo",
            active_offers: Object.keys(demoData.offers || {}).length,
            conversion_rate: 18.5,
            cron_ready_count: 5,
            cancellation_ready_count: 3,
            demo_ready: true,
            timestamp: new Date().toISOString()
        };
    }

    if (path.includes('/api/host/') && path.includes('/settings')) return demoData.host_settings;
    if (path.includes('/ready-bookings')) {
        const mapToReady = (b: any) => ({
            id: b.id,
            guest_name: b.guest_name,
            prop_name: demoData.properties.find((p: any) => p.id === b.prop_id)?.name || "Property",
            arrival_date: b.arrival_date
        });

        // Try to find demo specifically, fallback to any bookings if none found
        let cron = demoData.bookings.filter((b: any) => b.id.includes('budget'));
        if (cron.length === 0) cron = demoData.bookings.slice(0, 3);

        let cancel = demoData.bookings.filter((b: any) => b.id.includes('prem'));
        if (cancel.length === 0) cancel = demoData.bookings.slice(3, 6);

        return {
            cron_ready: cron.slice(0, 3).map(mapToReady),
            cancellation_ready: cancel.slice(0, 3).map(mapToReady)
        };
    }

    if (path.startsWith('/offer/')) {
        const id = path.split('/').pop() || "";
        return demoData.offers?.[id] || Object.values(demoData.offers || {})[0];
    }

    // --- ADMIN / OFFERS MOCK ---
    if (path.includes('/api/admin/offers')) {
        // Expiration Logic
        if (path.endsWith('/expire')) {
            const parts = path.split('/');
            const offerId = parts[parts.length - 2];
            if (demoData.offers && demoData.offers[offerId]) {
                demoData.offers[offerId].status = 'expired';
                demoData.offers[offerId].expires_at = new Date().toISOString();
                saveMockDB(demoData);
                return { status: "ok", message: `Offer ${offerId} expired.` };
            }
        }

        // Deletion Logic (sets to expired)
        if (options?.method === 'DELETE') {
            const offerId = path.split('/').pop();
            if (offerId && demoData.offers && demoData.offers[offerId]) {
                demoData.offers[offerId].status = 'expired';
                saveMockDB(demoData);
                return { status: "ok", message: "Offer marked as expired." };
            }
        }

        // List Logic (Show All)
        return Object.values(demoData.offers || {}).map((o: any) => ({
            ...o,
            guest_name: o.original_booking?.guest_name || "Demo Guest",
            prop_name: o.options?.[0]?.prop_name || "Demo Property"
        }));
    }

    // --- GENERIC DATA COLLECTORS ---
    if (path.includes('/properties')) return demoData.properties;
    if (path.includes('/bookings')) return demoData.bookings;
    if (path.includes('/settings')) return demoData.host_settings;

    console.warn(`[apiClient] Unhandled mock path: ${path}. Returning full demoData.`);
    return demoData;
}

export async function fetchOffer(offerId: string) {
    return apiClient(`/offer/${offerId}`);
}

export async function triggerDemo(type: 'cron' | 'cancellation', bookingId?: number) {
    return apiClient(`/demo/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, booking_id: bookingId })
    });
}

export async function queryBot(offerId: string, propId: string, question: string, history: any[] = []) {
    return apiClient(`/bot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, prop_id: propId, question, history })
    });
}

/** Admin Functions */
export async function listOffers() {
    return apiClient(`/api/admin/offers`);
}

export async function expireOffer(offerId: string) {
    return apiClient(`/api/admin/offers/${offerId}/expire`, { method: 'POST' });
}

export async function deleteOffer(offerId: string) {
    return apiClient(`/api/admin/offers/${offerId}`, { method: 'DELETE' });
}

