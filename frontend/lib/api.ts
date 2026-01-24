/**
 * API client for backend communication
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Shifts static dates to be relative to the current time.
 */
function normalizeDemoDates(data: any) {
    if (!data.metadata?.snapshot_at) return data;

    const snapshotDate = new Date(data.metadata.snapshot_at);
    const now = new Date();
    // Round to nearest day for consistency
    const diffMs = now.getTime() - snapshotDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return data;

    const shiftDate = (dateStr: string) => {
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
            if (o.original_booking) {
                o.original_booking.arrival_date = shiftDate(o.original_booking.arrival_date);
                o.original_booking.departure_date = shiftDate(o.original_booking.departure_date);
            }
        });
    }

    return data;
}

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
            let demoData = await fallbackRes.json();

            // Apply temporal normalization
            demoData = normalizeDemoDates(demoData);

            // Route mapping
            if (path.startsWith('/offer/')) {
                const id = path.split('/').pop() || "";
                return demoData.offers[id] || Object.values(demoData.offers)[0];
            }
            if (path.includes('/demo/status')) {
                const cronReady = demoData.bookings.filter((b: any) => {
                    const today = new Date();
                    const arrival = new Date(b.arrival_date);
                    const diff = (arrival.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff <= 10 && b.id.startsWith('demo_budget_');
                }).length;

                const cancelReady = demoData.bookings.filter((b: any) => b.id.startsWith('demo_prem_')).length;

                return {
                    status: "offline_simulated",
                    uptime: "0s",
                    engine: "static_snapshot",
                    active_offers: Object.keys(demoData.offers).length,
                    conversion_rate: demoData.host_settings.conversion_rate_pct || 0,
                    cron_ready_count: cronReady,
                    cancellation_ready_count: cancelReady,
                    demo_ready: true,
                    timestamp: new Date().toISOString()
                };
            }
            if (path.includes('/demo/ready-bookings')) {
                const cronBookings = demoData.bookings.filter((b: any) => b.id.startsWith('demo_budget_')).slice(0, 3);
                const premBookings = demoData.bookings.filter((b: any) => b.id.startsWith('demo_prem_')).slice(0, 3);

                const mapToReady = (b: any) => ({
                    id: b.id,
                    guest_name: b.guest_name,
                    prop_name: demoData.properties.find((p: any) => p.id === b.prop_id)?.name || "Property",
                    arrival_date: b.arrival_date
                });

                return {
                    cron_ready: cronBookings.map(mapToReady),
                    cancellation_ready: premBookings.map(mapToReady)
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

export async function queryBot(offerId: string, propId: string, question: string) {
    return apiClient(`/bot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, prop_id: propId, question })
    });
}

/** Admin Functions */
export async function listOffers() {
    return apiClient(`/api/admin/offers`);
}

export async function expireOffer(offerId: string) {
    return apiClient(`/api/admin/offers/${offerId}/expire`, { method: 'POST' });
}

