import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './api';
import * as session from './session';

// Mock fetch
global.fetch = vi.fn();

// Mock session
vi.mock('./session', () => ({
    getSessionId: vi.fn(() => 'test-session-id')
}));

describe('apiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('window', {});
        vi.mocked(session.getSessionId).mockReturnValue('test-session-id');
    });

    it('should include x-session-id and content-type in headers', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ success: true })
        };
        (fetch as any).mockResolvedValue(mockResponse);

        await apiClient('/test');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/test'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'x-session-id': 'test-session-id'
                })
            })
        );
    });

    it('should throw error on non-ok response', async () => {
        const mockResponse = {
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ error: 'Custom error message' })
        };
        (fetch as any).mockResolvedValue(mockResponse);

        await expect(apiClient('/not-found')).rejects.toThrow('Custom error message');
    });

    it('should handle non-json error responses', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => { throw new Error('Not JSON'); }
        };
        (fetch as any).mockResolvedValue(mockResponse);

        await expect(apiClient('/error')).rejects.toThrow('Internal Server Error');
    });
});
