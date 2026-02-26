import db from "@/core/db";
import { customers, auditLogs } from "@/core/db/schema";
import { ilike, or, desc, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

export type CustomerCreateInput = {
    userId: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    nationalIdType?: string | null;
    nationalIdNumber?: string | null;
    nationalIdExpiry?: string | null;
    notes?: string | null;
    nationalIdImagePaths?: string[];
};

export type CustomerUpdateInput = {
    name?: string;
    phone?: string | null;
    email?: string | null;
    nationalIdType?: string | null;
    nationalIdNumber?: string | null;
    nationalIdExpiry?: string | null;
    notes?: string | null;
};

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function findManyCustomers(opts: {
    search: string;
    page: number;
    limit: number;
}) {
    const { search, page, limit } = opts;
    const offset = (page - 1) * limit;

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

    const totalCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);

    const total = totalCountRes[0].count;

    return { data, total };
}

export async function findCustomerById(id: string) {
    return db.query.customers.findFirst({
        where: eq(customers.id, id),
        with: {
            loans: {
                orderBy: (loansTable, { desc: d }) => [d(loansTable.createdAt)],
            },
        },
    });
}

export async function createCustomer(
    input: CustomerCreateInput,
    tx?: Tx
) {
    const runner = tx ?? db;
    const [record] = await runner.insert(customers).values({
        userId: input.userId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        nationalIdType: input.nationalIdType,
        nationalIdNumber: input.nationalIdNumber,
        nationalIdExpiry: input.nationalIdExpiry ?? null,
        notes: input.notes,
        nationalIdImagePaths: input.nationalIdImagePaths ?? [],
    }).returning();
    return record;
}

export async function updateCustomer(
    id: string,
    input: CustomerUpdateInput,
    tx?: Tx
) {
    const runner = tx ?? db;

    const beforeState = await runner.query.customers.findFirst({
        where: eq(customers.id, id),
    });

    if (!beforeState) throw new Error("Customer not found");

    const [afterState] = await runner
        .update(customers)
        .set({
            name: input.name,
            phone: input.phone,
            email: input.email,
            nationalIdType: input.nationalIdType,
            nationalIdNumber: input.nationalIdNumber,
            nationalIdExpiry: input.nationalIdExpiry ?? null,
            notes: input.notes,
        })
        .where(eq(customers.id, id))
        .returning();

    return { beforeState, afterState };
}
