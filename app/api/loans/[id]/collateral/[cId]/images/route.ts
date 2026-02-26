import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { collateral, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string, cId: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadedPaths: string[] = [];

        // Validations & Uploads
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                throw new Error(`File ${file.name} exceeds 10MB limit`);
            }
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                throw new Error(`File ${file.name} has invalid type ${file.type}`);
            }

            const ext = file.name.split('.').pop();
            const timestamp = Date.now();
            const path = `${session.user.id}/${params.id}/collateral-${timestamp}.${ext}`;

            const uploadedPath = await uploadFile('collateral-docs', path, file);
            uploadedPaths.push(uploadedPath);
        }

        // Update collateral in transaction
        const updatedCollateral = await db.transaction(async (tx) => {
            const item = await tx.query.collateral.findFirst({
                where: and(eq(collateral.id, params.cId), eq(collateral.loanId, params.id))
            });

            if (!item) throw new Error("Collateral not found");

            const newPaths = [...(item.imagePaths || []), ...uploadedPaths];

            if (newPaths.length > 10) {
                throw new Error("Cannot have more than 10 files per collateral item");
            }

            const [afterState] = await tx.update(collateral)
                .set({ imagePaths: newPaths })
                .where(eq(collateral.id, params.cId))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "COLLATERAL_IMAGE_UPLOADED",
                entityType: "collateral",
                entityId: params.cId,
                metadata: { addedPaths: uploadedPaths, after: afterState }
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCollateral });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
