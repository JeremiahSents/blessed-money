import { getMonthlyRawData } from "@/core/repositories/report-repository";

export async function getMonthlyReport() {
    const { issuedRows, collectedRows, interestRows } = await getMonthlyRawData();

    const monthsSet = new Set<string>();
    issuedRows.forEach((row) => monthsSet.add(row.month));
    collectedRows.forEach((row) => monthsSet.add(row.month));
    interestRows.forEach((row) => monthsSet.add(row.month));

    const allMonths = Array.from(monthsSet).sort().reverse();

    return allMonths.map((month) => {
        const issued = issuedRows.find((r) => r.month === month) || {
            count: 0,
            total_principal: 0,
        };
        const collected = collectedRows.find((r) => r.month === month) || {
            total_collected: 0,
        };
        const interest = interestRows.find((r) => r.month === month) || {
            total_interest: 0,
        };

        return {
            month,
            loansIssuedCount: Number(issued.count ?? 0),
            loansIssuedPrincipal: Number(issued.total_principal ?? 0),
            collected: Number(collected.total_collected ?? 0),
            interestEarned: Number(interest.total_interest ?? 0),
        };
    });
}
