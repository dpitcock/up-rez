import { describe, it, expect } from 'vitest';
import { calculateOfferPricing, computeScore, generatePropertyDiffs } from './offerService';

describe('calculateOfferPricing each', () => {
    const testCases = [
        {
            name: 'apply maximum discount when it results in lift above minimum',
            inputs: [150, 250, 1, 0.8, 150, 15], // fromAdr, toAdr, nights, maxDiscountPct, fromTotal, minLift
            expected: { revenue_lift: 20, offer_adr: 170 }
        },
        {
            name: 'respect minimum revenue lift when discounted lift falls below it',
            inputs: [150, 250, 1, 0.9, 150, 30],
            expected: { revenue_lift: 30, offer_adr: 180 }
        },
        {
            name: 'never charge more than rack rate difference even if below min lift',
            inputs: [150, 160, 1, 0.5, 150, 30],
            expected: { revenue_lift: 10, offer_adr: 160 }
        },
        {
            name: 'handle multi-night stays correctly',
            inputs: [100, 200, 3, 0.5, 300, 20],
            expected: { revenue_lift: 150, offer_total: 450, offer_adr: 150 }
        }
    ];

    it.each(testCases)('$name', ({ inputs, expected }) => {
        const [fromAdr, toAdr, nights, maxDiscountPct, fromTotal, minLiftPerNight] = inputs;
        const result = calculateOfferPricing(
            fromAdr,
            toAdr,
            nights,
            maxDiscountPct,
            fromTotal,
            minLiftPerNight as number
        );

        expect(result.revenue_lift).toBeCloseTo(expected.revenue_lift);
        if (expected.offer_adr) expect(result.offer_adr).toBeCloseTo(expected.offer_adr);
        if (expected.offer_total) expect(result.offer_total).toBeCloseTo(expected.offer_total);
    });
});

describe('computeScore', () => {
    const baseProp = { beds: 2, baths: 1, list_nightly_rate: 100, location: 'Palma' };
    const baseBooking = { prop_id: 'p1', base_nightly_rate: 100 };

    it('should score a property with more beds higher', () => {
        const candidate = { ...baseProp, beds: 3 };
        const score = computeScore(baseProp as any, candidate as any, baseBooking as any);
        expect(score).toBeGreaterThan(5);
    });

    it('should cap the score at 10', () => {
        const candidate = { ...baseProp, beds: 10, baths: 10, list_nightly_rate: 200, location: 'Palma' };
        const score = computeScore(baseProp as any, candidate as any, baseBooking as any);
        expect(score).toBe(10);
    });
});

describe('generatePropertyDiffs', () => {
    it('should identify extra bedrooms', () => {
        const orig = { beds: 2, baths: 1 };
        const cand = { beds: 4, baths: 1 };
        const diffs = generatePropertyDiffs(orig as any, cand as any);
        expect(diffs).toContain('2 Extra Bedroom(s)');
    });

    it('should identify additional bathrooms', () => {
        const orig = { beds: 2, baths: 1 };
        const cand = { beds: 2, baths: 2 };
        const diffs = generatePropertyDiffs(orig as any, cand as any);
        expect(diffs).toContain('Additional Bathroom');
    });
});
