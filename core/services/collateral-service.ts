import db from "@/core/db";
import { auditLogs } from "@/core/db/schema";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();
import {
    createCollateral,
    findCollateralById,
    updateCollateral,
    deleteCollateral,
    type CollateralCreateInput,
    type CollateralUpdateInput,
} from "@/core/repositories/collateral-repository";

export type AddCollateralPayload = Omit<CollateralCreateInput, "loanId">;

export async function addCollateral(
    loanId: string,
    data: AddCollateralPayload,
    userId: string
) {
    return db.transaction(async (tx) => {
        const item = await createCollateral({ loanId, ...data }, tx);

        await tx.insert(auditLogs).values({
            userId,
            action: "COLLATERAL_ADDED",
            entityType: "collateral",
            entityId: item.id,
            metadata: { after: item },
        });

        return item;
    });
}

export async function updateCollateralItem(
    loanId: string,
    cId: string,
    data: CollateralUpdateInput & { markReturned?: boolean },
    userId: string
) {
    return db.transaction(async (tx) => {
        const beforeState = await findCollateralById(loanId, cId, tx);

        if (!beforeState) throw new Error("Collateral not found");

        const updateData: CollateralUpdateInput = data.markReturned
            ? { returnedAt: new Date() }
            : {
                description: data.description,
                estimatedValue: data.estimatedValue ?? null,
                serialNumber: data.serialNumber,
                notes: data.notes,
            };

        const afterState = await updateCollateral(cId, updateData, tx);

        await tx.insert(auditLogs).values({
            userId,
            action: data.markReturned ? "COLLATERAL_RETURNED" : "COLLATERAL_UPDATED",
            entityType: "collateral",
            entityId: cId,
            metadata: { before: beforeState, after: afterState },
        });

        return afterState;
    });
}

export async function removeCollateral(
    loanId: string,
    cId: string,
    userId: string
) {
    return db.transaction(async (tx) => {
        const item = await findCollateralById(loanId, cId, tx);

        if (!item) throw new Error("Collateral not found");

        // Delete images from UploadThing
        // imagePaths now stores full UploadThing URLs (<appId>.ufs.sh/f/<key>)
        if (item.imagePaths && item.imagePaths.length > 0) {
            try {
                const keys = item.imagePaths
                    .map((url) => url.split("/f/").at(-1))
                    .filter((k): k is string => Boolean(k));
                if (keys.length > 0) await utapi.deleteFiles(keys);
            } catch {
                // Ignore errors if files were already removed
            }
        }

        await deleteCollateral(cId, tx);

        await tx.insert(auditLogs).values({
            userId,
            action: "COLLATERAL_DELETED",
            entityType: "collateral",
            entityId: cId,
            metadata: { deletedItem: item },
        });
    });
}
