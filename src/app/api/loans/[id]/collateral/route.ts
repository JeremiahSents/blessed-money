import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { collateral, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const newCollateral = await db.transaction(async (tx) => {
            const [item] = await tx.insert(collateral).values({
                loanId: params.id,
                description: body.description,
                estimatedValue: body.estimatedValue ? Number(body.estimatedValue).toFixed(2) : null,
                serialNumber: body.serialNumber,
                imagePaths: body.imagePaths || [],
                notes: body.notes,
            }).returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "COLLATERAL_ADDED",
                entityType: "collateral",
                entityId: item.id,
                metadata: { after: item }
            });

            return item;
        });

        return NextResponse.json({ data: newCollateral });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
