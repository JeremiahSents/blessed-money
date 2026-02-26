import db from "@/core/db";
import { sql } from "drizzle-orm";

type MonthRow = {
    month: string;
    count?: string | number;
    total_principal?: string | number;
    total_collected?: string | number;
    total_interest?: string | number;
};

export async function getMonthlyRawData() {
    const loansIssuedRaw = await db.execute(sql`
        SELECT TO_CHAR(start_date, 'YYYY-MM') as month, COUNT(*) as count, SUM(CAST(principal_amount AS NUMERIC)) as total_principal
        FROM loans
        GROUP BY TO_CHAR(start_date, 'YYYY-MM')
        ORDER BY month DESC
    `);

    const collectedRaw = await db.execute(sql`
        SELECT TO_CHAR(paid_at, 'YYYY-MM') as month, SUM(CAST(amount AS NUMERIC)) as total_collected
        FROM payments
        GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
        ORDER BY month DESC
    `);

    const interestRaw = await db.execute(sql`
        SELECT TO_CHAR(cycle_start_date, 'YYYY-MM') as month, SUM(CAST(interest_charged AS NUMERIC)) as total_interest
        FROM billing_cycles
        GROUP BY TO_CHAR(cycle_start_date, 'YYYY-MM')
        ORDER BY month DESC
    `);

    return {
        issuedRows: loansIssuedRaw as unknown as MonthRow[],
        collectedRows: collectedRaw as unknown as MonthRow[],
        interestRows: interestRaw as unknown as MonthRow[],
    };
}
