import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { collateral, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string, cId: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        // Support "markReturned" shortcut
        const updateData: any = body.markReturned ? {
            returnedAt: new Date().toISOString()
        } : {
            description: body.description,
            estimatedValue: body.estimatedValue ? Number(body.estimatedValue).toFixed(2) : null,
            serialNumber: body.serialNumber,
            notes: body.notes,
        };

        const updatedItem = await db.transaction(async (tx) => {
            const beforeState = await tx.query.collateral.findFirst({
                where: and(eq(collateral.id, params.cId), eq(collateral.loanId, params.id))
            });

            if (!beforeState) throw new Error("Collateral not found");

            const [afterState] = await tx.update(collateral)
                .set(updateData)
                .where(eq(collateral.id, params.cId))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: body.markReturned ? "COLLATERAL_RETURNED" : "COLLATERAL_UPDATED",
                entityType: "collateral",
                entityId: params.cId,
                metadata: { before: beforeState, after: afterState }
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedItem });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string, cId: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await db.transaction(async (tx) => {
            const item = await tx.query.collateral.findFirst({
                where: and(eq(collateral.id, params.cId), eq(collateral.loanId, params.id))
            });

            if (!item) throw new Error("Collateral not found");

            // Delete images from storage bucket
            if (item.imagePaths && item.imagePaths.length > 0) {
                for (const path of item.imagePaths) {
                    try {
                        await deleteFile('collateral-docs', path);
                    } catch (ignore) {
                        // Ignore missing file errors if bucket got out of sync
                    }
                }
            }

            await tx.delete(collateral).where(eq(collateral.id, params.cId));

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "COLLATERAL_DELETED",
                entityType: "collateral",
                entityId: params.cId,
                metadata: { deletedItem: item }
            });
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
