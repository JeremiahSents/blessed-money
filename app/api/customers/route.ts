import { NextRequest, NextResponse } from "next/server";
import db from "@/src/index";
import { customers, auditLogs } from "@/src/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ilike, or, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/errors";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    try {
        const whereClause = search
            ? or(
                ilike(customers.name, `%${search}%`),
                ilike(customers.phone, `%${search}%`),
                ilike(customers.nationalIdNumber, `%${search}%`)
            )
            : undefined;

        const data = await db.query.customers.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: [desc(customers.createdAt)],
        });

        // Get total count
        const totalCountRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(whereClause);

        const total = totalCountRes[0].count;

        return NextResponse.json({
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        // In Drizzle Postgres, calling await db.transaction() ensures atomic writes
        const newCustomer = await db.transaction(async (tx) => {
            const [insertResult] = await tx.insert(customers).values({
                userId: session.user.id,
                name: body.name,
                phone: body.phone,
                email: body.email,
                nationalIdType: body.nationalIdType,
                nationalIdNumber: body.nationalIdNumber,
                nationalIdExpiry: body.nationalIdExpiry ? new Date(body.nationalIdExpiry).toISOString().split('T')[0] : null,
                notes: body.notes,
                nationalIdImagePaths: body.nationalIdImagePaths || [],
            }).returning();

            await tx.insert(auditLogs).values({
                userId: session.user.id,
                action: "CUSTOMER_CREATED",
                entityType: "customer",
                entityId: insertResult.id,
                metadata: { after: insertResult }
            });

            return insertResult;
        });

        return NextResponse.json({ data: newCustomer });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
    }
}
