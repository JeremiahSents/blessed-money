import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { loans, billingCycles, collateral, auditLogs, customers } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCycle } from "@/lib/interest";
import { parseCurrency } from "@/lib/utils";
import { desc, eq, ilike, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as 'active' | 'overdue' | 'settled' | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    try {
        const whereClause = status ? eq(loans.status, status) : undefined;

        const data = await db.query.loans.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: [desc(loans.createdAt)],
            with: {
                customer: true,
            }
        });

        const totalCountRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(loans)
            .where(whereClause);

        const total = totalCountRes[0].count;

        return NextResponse.json({
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Expected body format for collateral: files are pre-uploaded and URLs passed OR we just accept JSON
        // The spec says: On submit: create loan + first billingCycle + all collateral records + upload all files to Supabase Storage in a single flow.
        // However, handling multipart/form-data with nested arrays is complex in standard fetch. 
        // It's often easier to have the client upload files to /api/.../collateral/... first, or pass them as base64 (not recommended for large files).
        // Let's assume the UI calls the storage action directly to upload files, gets paths, and passes JSON here.
        // The user's spec details: "<CollateralUploader /> On form submit calls a server action that: uploads... stores returned path".
        // So paths are pre-uploaded or uploaded by a Server Action on the same form submit before hitting this API, OR this API parses JSON with paths.
        // Let's use JSON with pre-uploaded paths for simplicity, as per standard React Hook Form usage.

        const body = await req.json();
        const { customerId, principalAmount, interestRate, startDate, dueDate, notes, collateralItems } = body;

        const principalFormatStr = (typeof principalAmount === 'number' ? principalAmount.toFixed(2) : principalAmount);
        const principalCents = parseCurrency(principalFormatStr);

        if (principalCents <= 0n) {
            throw new Error("Principal amount must be greater than zero");
        }

        const firstCycleData = createCycle(principalCents, interestRate || "0.2000");

        const newLoan = await db.transaction(async (tx) => {
            // 1. Create Loan
            const [loan] = await tx.insert(loans).values({
                customerId,
                principalAmount: (Number(principalCents) / 100).toFixed(2),
                interestRate: interestRate || "0.2000",
                startDate: new Date(startDate).toISOString().split('T')[0],
                dueDate: new Date(dueDate).toISOString().split('T')[0],
                status: "active",
                notes,
            }).returning();

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
            if (collateralItems && Array.isArray(collateralItems) && collateralItems.length > 0) {
                for (const item of collateralItems) {
                    const [collateralRecord] = await tx.insert(collateral).values({
                        loanId: loan.id,
                        description: item.description,
                        estimatedValue: item.estimatedValue ? Number(item.estimatedValue).toFixed(2) : null,
                        serialNumber: item.serialNumber,
                        imagePaths: item.imagePaths || [],
                        notes: item.notes,
                    }).returning();

                    // Audit log for each collateral
                    await tx.insert(auditLogs).values({
                        userId: session.user.id,
                        action: "COLLATERAL_ADDED",
                        entityType: "collateral",
                        entityId: collateralRecord.id,
                        metadata: { after: collateralRecord }
                    });
                }
            }

            // 4. Audit Log for Loan
            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "LOAN_CREATED",
                entityType: "loan",
                entityId: loan.id,
                metadata: { after: loan, initialCycle: firstCycleData }
            });

            return loan;
        });

        return NextResponse.json({ data: newLoan });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
