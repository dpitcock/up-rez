import { describe, it, expect } from 'vitest';
import { processTemplate, processProps, getOfferContext } from './templateUtils';

describe('Template Processing', () => {
    describe('processTemplate', () => {
        it('should replace variables with data', () => {
            const template = 'Hello {{guest_name}}! Welcome to {{prop_name}}.';
            const data = { guest_name: 'Alice', prop_name: 'Villa Sun' };
            expect(processTemplate(template, data)).toBe('Hello Alice! Welcome to Villa Sun.');
        });

        it('should handle missing keys gracefully', () => {
            const template = 'Hello {{missing_key}}!';
            const data = { guest_name: 'Alice' };
            expect(processTemplate(template, data)).toBe('Hello {{missing_key}}!');
        });

        it('should handle non-string inputs', () => {
            expect(processTemplate(123 as any, {})).toBe(123);
        });
    });

    describe('processProps', () => {
        it('should process string props', () => {
            const props = { headline: 'Welcome {{guest_name}}' };
            const data = { guest_name: 'Bob' };
            expect(processProps(props, data)).toEqual({ headline: 'Welcome Bob' });
        });

        it('should process array props', () => {
            const props = { items: ['Feature: {{feat1}}', 'No var'] };
            const data = { feat1: 'Pool' };
            expect(processProps(props, data)).toEqual({ items: ['Feature: Pool', 'No var'] });
        });
    });
});

describe('getOfferContext', () => {
    it('should normalize offer data into context', () => {
        const offer = { id: 'off_123', expires_at: '2025-12-31' };
        const booking = { guest_name: 'Alice' };
        const options = [{
            prop_name: 'Luxury Suite',
            pricing: { revenue_lift: 100, nights: 2, offer_total: 500, discount_percent: 10 },
            images: ['/img.png'],
            ai_copy: { landing_hero: 'Amazing Hero' }
        }];

        const context = getOfferContext(offer, booking, options);
        expect(context.guest_name).toBe('Alice');
        expect(context.prop_name).toBe('Luxury Suite');
        expect(context.upgrade_fee_night).toBe(50);
        expect(context.ai_headline).toBe('Amazing Hero');
    });
});
