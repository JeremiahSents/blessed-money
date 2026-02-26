import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { customers, auditLogs, loans } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, params.id),
            with: {
                loans: {
                    orderBy: [desc(loans.createdAt)]
                }
            }
        });

        if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: customer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        const updatedCustomer = await db.transaction(async (tx) => {
            // Get before state for audit log
            const beforeState = await tx.query.customers.findFirst({
                where: eq(customers.id, params.id)
            });

            if (!beforeState) throw new Error("Customer not found");

            const [afterState] = await tx.update(customers)
                .set({
                    name: body.name,
                    phone: body.phone,
                    email: body.email,
                    nationalIdType: body.nationalIdType,
                    nationalIdNumber: body.nationalIdNumber,
                    nationalIdExpiry: body.nationalIdExpiry ? new Date(body.nationalIdExpiry).toISOString().split('T')[0] : null,
                    notes: body.notes,
                })
                .where(eq(customers.id, params.id))
                .returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_UPDATED",
                entityType: "customer",
                entityId: params.id,
                metadata: { before: beforeState, after: afterState }
            });

            return afterState;
        });

        return NextResponse.json({ data: updatedCustomer });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
