/**
 * API client for backend communication
 */

import { getSessionId } from './session';

const BACKEND_URL = '/api';

/**
 * Robust fetcher for backend communication
 */
export async function apiClient(path: string, options?: RequestInit) {
    const sessionId = typeof window !== 'undefined' ? getSessionId() : '';

    const headers = {
        'Content-Type': 'application/json',
        ...options?.headers,
        'x-session-id': sessionId
    };

    const response = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers,
        cache: 'no-store'
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: response.statusText };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

/** Helper Functions */

export async function fetchOffer(offerId: string) {
    return apiClient(`/offers/${offerId}`);
}

export async function triggerDemo(type: 'cron' | 'cancellation', bookingId?: string) {
    const sessionId = getSessionId();
    return apiClient(`/demo/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, booking_id: bookingId, session_id: sessionId })
    });
}

export async function resetDemo() {
    const sessionId = getSessionId();
    return apiClient(`/demo/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
    });
}

export async function queryBot(offerId: string, propId: string, question: string, history: any[] = []) {
    return apiClient(`/bot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, prop_id: propId, question, history })
    });
}

export async function listOffers() {
    return apiClient(`/offers`);
}

export async function expireOffer(offerId: string) {
    return apiClient(`/offers/${offerId}/expire`, { method: 'POST' });
}

export async function deleteOffer(offerId: string) {
    return apiClient(`/offers/${offerId}`, { method: 'DELETE' });
}
