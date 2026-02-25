/**
 * Cent-based interest calculation engine for LendTrack.
 * All amounts must be in cents (BigInt) to avoid floating-point drift.
 */

export interface BillingCycleData {
    openingPrincipalCents: bigint;
    interestChargedCents: bigint;
    totalDueCents: bigint;
    totalPaidCents: bigint;
    balanceCents: bigint;
}

/**
 * Parses numeric interest rate string to a multiplier fraction.
 * e.g., "0.2000" -> applied as * 2000n / 10000n
 */
export function calculateInterest(principalCents: bigint, interestRateStr: string): bigint {
    // Convert "0.2000" -> 2000 mathematically:
    // We can just parse float, multiply by 10000, round, and convert to BigInt
    const rateNumerator = BigInt(Math.round(parseFloat(interestRateStr) * 10000));
    const rateDenominator = 10000n;

    // (Principal * RateNumerator) / 10000
    return (principalCents * rateNumerator) / rateDenominator;
}

/**
 * Calculates a new cycle from an opening principal and rate.
 * Used for both Cycle 1 and subsequent rollover cycles.
 */
export function createCycle(
    openingPrincipalCents: bigint,
    interestRateStr: string
): BillingCycleData {
    const interestChargedCents = calculateInterest(openingPrincipalCents, interestRateStr);
    const totalDueCents = openingPrincipalCents + interestChargedCents;

    return {
        openingPrincipalCents,
        interestChargedCents,
        totalDueCents,
        totalPaidCents: 0n,
        balanceCents: totalDueCents,
    };
}

/**
 * Generates the NEXT cycle data based on the previous cycle's closing state.
 * If balance > 0, rolls it over as the new opening principal.
 */
export function calculateNextCycle(
    previousBalanceCents: bigint,
    interestRateStr: string
): BillingCycleData {
    return createCycle(previousBalanceCents, interestRateStr);
}

/**
 * Applies a payment to an existing cycle, returning the updated cycle state.
 */
export function applyPayment(
    cycle: BillingCycleData,
    paymentCents: bigint
): BillingCycleData {
    const newTotalPaid = cycle.totalPaidCents + paymentCents;
    const newBalance = cycle.totalDueCents - newTotalPaid;

    // Balance cannot be negative mathematically in our simple logic, but handles overpayment gracefully (negative balance)
    return {
        ...cycle,
        totalPaidCents: newTotalPaid,
        balanceCents: newBalance,
    };
}
