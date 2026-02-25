import { expect, test, describe } from 'vitest';
import { createCycle, calculateNextCycle, applyPayment } from './interest';

describe('Interest Calculation Logic', () => {
    test('Cycle 1 - Full payment (settled)', () => {
        // $100 @ 20%
        const cycle1 = createCycle(10000n, "0.2000");

        expect(cycle1.openingPrincipalCents).toBe(10000n);
        expect(cycle1.interestChargedCents).toBe(2000n);
        expect(cycle1.totalDueCents).toBe(12000n);
        expect(cycle1.balanceCents).toBe(12000n);

        // Pay $120
        const updatedCycle1 = applyPayment(cycle1, 12000n);
        expect(updatedCycle1.totalPaidCents).toBe(12000n);
        expect(updatedCycle1.balanceCents).toBe(0n);
    });

    test('Partial payment rollover (cycles 2 and 3)', () => {
        // $100 @ 20%
        const cycle1 = createCycle(10000n, "0.2000");

        // Pay $80 out of $120
        const updatedCycle1 = applyPayment(cycle1, 8000n);
        expect(updatedCycle1.balanceCents).toBe(4000n); // $40 balance

        // Cycle 2: rollover $40 balance
        const cycle2 = calculateNextCycle(updatedCycle1.balanceCents, "0.2000");
        expect(cycle2.openingPrincipalCents).toBe(4000n);
        expect(cycle2.interestChargedCents).toBe(800n);     // $8 interest
        expect(cycle2.totalDueCents).toBe(4800n);       // $48 due

        // Pay $0 in Cycle 2
        const updatedCycle2 = applyPayment(cycle2, 0n);

        // Cycle 3: rollover $48 balance
        const cycle3 = calculateNextCycle(updatedCycle2.balanceCents, "0.2000");
        expect(cycle3.openingPrincipalCents).toBe(4800n);
        expect(cycle3.interestChargedCents).toBe(960n);     // $9.60 interest
        expect(cycle3.totalDueCents).toBe(5760n);       // $57.60 due
    });

    test('Zero payment full rollover', () => {
        // $100 @ 20%
        const cycle1 = createCycle(10000n, "0.2000");
        // $120 balance rolls over
        const cycle2 = calculateNextCycle(cycle1.balanceCents, "0.2000");
        expect(cycle2.interestChargedCents).toBe(2400n); // $24 interest
        expect(cycle2.totalDueCents).toBe(14400n); // $144 due
    });

    test('Exact cent-level precision (no floating point drift)', () => {
        // $100.33 @ 20.01%
        const cycle1 = createCycle(10033n, "0.2001");
        // Interest = 10033 * 2001 / 10000 = 2007.6033 -> floored to 2007 cents ($20.07)
        expect(cycle1.interestChargedCents).toBe(2007n);
        expect(cycle1.totalDueCents).toBe(12040n); // $120.40
    });
});
