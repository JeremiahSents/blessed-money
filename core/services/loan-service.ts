import db from "@/core/db";
import { billingCycles, auditLogs } from "@/core/db/schema";
import { createCycle } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import {
    findManyLoans,
    findLoanById,
    createLoan,
} from "@/core/repositories/loan-repository";
import { createCollateral } from "@/core/repositories/collateral-repository";

export type LoanCreatePayload = {
    customerId: string;
    principalAmount: number | string;
    interestRate?: string;
    startDate: string;
    dueDate: string;
    notes?: string | null;
    collateralItems?: Array<{
        description: string;
        estimatedValue?: string | number | null;
        serialNumber?: string | null;
        imagePaths?: string[];
        notes?: string | null;
    }>;
};

export async function listLoans(opts: {
    status: "active" | "overdue" | "settled" | null;
    page: number;
    limit: number;
}) {
    return findManyLoans(opts);
}

export async function getLoan(id: string) {
    return findLoanById(id);
}

export async function createLoanWithCycleAndAudit(
    data: LoanCreatePayload,
    userId: string
) {
    const principalFormatStr =
        typeof data.principalAmount === "number"
            ? data.principalAmount.toFixed(2)
            : data.principalAmount;

    const principalCents = parseCurrency(principalFormatStr);

    if (principalCents <= 0n) {
        throw new Error("Principal amount must be greater than zero");
    }

    const interestRate = data.interestRate || "0.2000";
    const firstCycleData = createCycle(principalCents, interestRate);

    return db.transaction(async (tx) => {
        // 1. Create Loan
        const loan = await createLoan(
            {
                customerId: data.customerId,
                principalAmount: (Number(principalCents) / 100).toFixed(2),
                interestRate,
                startDate: new Date(data.startDate).toISOString().split("T")[0],
                dueDate: new Date(data.dueDate).toISOString().split("T")[0],
                status: "active",
                notes: data.notes,
            },
            tx
        );

        // 2. Create First Billing Cycle
        await tx.insert(billingCycles).values({
            loanId: loan.id,
            cycleNumber: 1,
            cycleStartDate: loan.startDate,
            cycleEndDate: loan.dueDate,
            openingPrincipal: (Number(firstCycleData.openingPrincipalCents) / 100).toFixed(2),
            interestCharged: (Number(firstCycleData.interestChargedCents) / 100).toFixed(2),
            totalDue: (Number(firstCycleData.totalDueCents) / 100).toFixed(2),
            totalPaid: "0.00",
            balance: (Number(firstCycleData.balanceCents) / 100).toFixed(2),
            status: "open",
        });

        // 3. Create Collateral Items
        if (
            data.collateralItems &&
            Array.isArray(data.collateralItems) &&
            data.collateralItems.length > 0
        ) {
            for (const item of data.collateralItems) {
                const collateralRecord = await createCollateral(
                    {
                        loanId: loan.id,
                        description: item.description,
                        estimatedValue: item.estimatedValue
                            ? Number(item.estimatedValue).toFixed(2)
                            : null,
                        serialNumber: item.serialNumber,
                        imagePaths: item.imagePaths || [],
                        notes: item.notes,
                    },
                    tx
                );

                await tx.insert(auditLogs).values({
                    userId,
                    action: "COLLATERAL_ADDED",
                    entityType: "collateral",
                    entityId: collateralRecord.id,
                    metadata: { after: collateralRecord },
                });
            }
        }

        // 4. Audit Log for Loan
        await tx.insert(auditLogs).values({
            userId,
            action: "LOAN_CREATED",
            entityType: "loan",
            entityId: loan.id,
            metadata: { after: loan, initialCycle: firstCycleData },
        });

        return loan;
    });
}
