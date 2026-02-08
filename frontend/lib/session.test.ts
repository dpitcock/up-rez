import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionId, clearSessionId, refreshSessionId } from './session';

describe('session utils', () => {
    const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('window', { localStorage: mockLocalStorage });
        vi.stubGlobal('localStorage', mockLocalStorage);
    });

    it('should return existing session id from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('existing-id');
        expect(getSessionId()).toBe('existing-id');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('uprez_session_id');
    });

    it('should generate and save new session id if none exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const id = getSessionId();
        expect(id).toBeDefined();
        expect(id.length).toBeGreaterThan(10);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uprez_session_id', id);
    });

    it('should clear session id', () => {
        clearSessionId();
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uprez_session_id');
    });

    it('should refresh session id', () => {
        const oldId = 'old-id';
        mockLocalStorage.getItem.mockReturnValue(oldId);
        const newId = refreshSessionId();
        expect(newId).not.toBe(oldId);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uprez_session_id', newId);
    });
});
