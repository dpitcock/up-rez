/**
 * API client for backend communication
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Robust fetcher with local fallback for Vercel/Static deployments
 */
export async function apiClient(path: string, options?: RequestInit) {
    try {
        const response = await fetch(`${BACKEND_URL}${path}`, options);
        if (response.ok) return await response.json();
        throw new Error(`API Error: ${response.status}`);
    } catch (err) {
        console.warn(`Backend unreachable at ${path}, attempting local fallback...`, err);

        // Mock success for mutations in demo mode
        if (options?.method && options.method !== 'GET') {
            return { status: "simulated_success", note: "Running in static demo mode" };
        }

        try {
            const fallbackRes = await fetch('/demo-data.json');
            const demoData = await fallbackRes.json();

            // Route mapping
            if (path.startsWith('/offer/')) {
                const id = path.split('/').pop() || "";
                return demoData.offers[id] || Object.values(demoData.offers)[0];
            }
            if (path.includes('/demo/status')) {
                return {
                    status: "offline_simulated",
                    uptime: "0s",
                    engine: "static_snapshot",
                    active_offers: Object.keys(demoData.offers).length,
                    conversion_rate: demoData.host_settings.conversion_rate_pct || 0
                };
            }
            if (path.includes('/demo/ready-bookings')) {
                return {
                    cron_ready: demoData.bookings.slice(0, 3).map((b: any) => ({
                        id: b.id,
                        guest_name: b.guest_name,
                        prop_name: demoData.properties.find((p: any) => p.id === b.prop_id)?.name || "Property",
                        arrival_date: b.arrival_date
                    })),
                    cancellation_ready: []
                };
            }
            if (path.includes('/demo/properties')) return demoData.properties;
            if (path.includes('/settings')) return demoData.host_settings;
            if (path.includes('/templates')) return []; // Mock empty templates for demo

            return demoData;
        } catch (fallbackErr) {
            console.error("Critical: Fallback also failed", fallbackErr);
            throw err;
        }
    }
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

export async function queryBot(offerId: number, propId: number, question: string) {
    return apiClient(`/bot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, prop_id: propId, question })
    });
}
