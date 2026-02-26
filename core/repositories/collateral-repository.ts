import db from "@/core/db";
import { collateral } from "@/core/db/schema";
import { and, eq } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CollateralCreateInput = {
    loanId: string;
    description: string;
    estimatedValue?: string | null;
    serialNumber?: string | null;
    imagePaths?: string[];
    notes?: string | null;
};

export type CollateralUpdateInput = {
    returnedAt?: string;
    description?: string;
    estimatedValue?: string | null;
    serialNumber?: string | null;
    notes?: string | null;
};

export async function createCollateral(input: CollateralCreateInput, tx?: Tx) {
    const runner = tx ?? db;
    const [item] = await runner.insert(collateral).values(input).returning();
    return item;
}

export async function findCollateralById(loanId: string, cId: string, tx?: Tx) {
    const runner = tx ?? db;
    return runner.query.collateral.findFirst({
        where: and(eq(collateral.id, cId), eq(collateral.loanId, loanId)),
    });
}

export async function updateCollateral(
    cId: string,
    data: CollateralUpdateInput,
    tx?: Tx
) {
    const runner = tx ?? db;
    const [afterState] = await runner
        .update(collateral)
        .set(data)
        .where(eq(collateral.id, cId))
        .returning();
    return afterState;
}

export async function deleteCollateral(cId: string, tx?: Tx) {
    const runner = tx ?? db;
    await runner.delete(collateral).where(eq(collateral.id, cId));
}
