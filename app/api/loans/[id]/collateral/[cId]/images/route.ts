import { NextRequest, NextResponse } from "next/server";
import db from "@/core/db/index";
import { collateral, auditLogs } from "@/core/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * POST /api/loans/[id]/collateral/[cId]/images
 * Body: { urls: string[] }  — public UploadThing URLs returned from onClientUploadComplete
 * Persists the UploadThing file URLs into the collateral item's imagePaths array.
 */
export async function POST(req: NextRequest, props: { params: Promise<{ id: string; cId: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json() as { urls: string[] };
        const { urls } = body;

        if (!urls || urls.length === 0) {
            return NextResponse.json({ error: "No file URLs provided" }, { status: 400 });
        }

        const updatedCollateral = await db.transaction(async (tx) => {
            const item = await tx.query.collateral.findFirst({
                where: and(eq(collateral.id, params.cId), eq(collateral.loanId, params.id)),
            });

            if (!item) throw new Error("Collateral not found");

            const newPaths = [...(item.imagePaths || []), ...urls];

            if (newPaths.length > 10) {
                throw new Error("Cannot have more than 10 files per collateral item");
            }

            const [afterState] = await tx
                .update(collateral)
                .set({ imagePaths: newPaths })
                .where(eq(collateral.id, params.cId))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "COLLATERAL_IMAGE_UPLOADED",
                entityType: "collateral",
                entityId: params.cId,
                metadata: { addedUrls: urls, after: afterState },
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCollateral });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
