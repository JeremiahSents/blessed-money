import db from "@/db";
import { customers, loans, billingCycles, auditLogs } from "@/db/schema";
import { ilike, or, desc, sql, and, ne, eq } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CustomerCreateInput = {
    name: string;
    phone?: string | null;
    notes?: string | null;
};

export type CustomerUpdateInput = {
    name?: string;
    phone?: string | null;
    notes?: string | null;
};

// ── Queries ────────────────────────────────────────────────────────────────

export async function listCustomers(opts: {
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
            ilike(sql`${customers.id}::text`, `%${search}%`)
        )
        : undefined;

    // Aggregate subquery: active loan count, total lent, outstanding balance per customer
    const aggregates = await db
        .select({
            customerId: loans.customerId,
            activeLoanCount: sql<number>`count(case when ${loans.status} != 'settled' then 1 end)`,
            totalLent: sql<string>`coalesce(sum(${loans.principalAmount}), 0)`,
        })
        .from(loans)
        .groupBy(loans.customerId);

    const balances = await db
        .select({
            customerId: loans.customerId,
            outstandingBalance: sql<string>`coalesce(sum(${billingCycles.balance}), 0)`,
        })
        .from(billingCycles)
        .innerJoin(loans, eq(billingCycles.loanId, loans.id))
        .where(ne(billingCycles.status, 'closed'))
        .groupBy(loans.customerId);

    const aggregateMap = new Map(aggregates.map(a => [a.customerId, a]));
    const balanceMap = new Map(balances.map(b => [b.customerId, b]));

    const data = await db.query.customers.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(customers.createdAt)],
    });

    const dataWithAggregates = data.map(c => ({
        ...c,
        activeLoanCount: Number(aggregateMap.get(c.id)?.activeLoanCount ?? 0),
        totalLent: aggregateMap.get(c.id)?.totalLent ?? "0",
        outstandingBalance: balanceMap.get(c.id)?.outstandingBalance ?? "0",
    }));

    const totalCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);

    const total = totalCountRes[0].count;

    return { data: dataWithAggregates, total };
}

export async function getCustomer(id: string) {
    const customerData = await db.query.customers.findFirst({
        where: eq(customers.id, id),
        with: {
            loans: {
                orderBy: (loansTable, { desc: d }) => [d(loansTable.createdAt)],
                with: {
                    billingCycles: {
                        orderBy: (bc, { asc: a }) => [a(bc.cycleNumber)],
                    },
                    payments: {
                        orderBy: (p, { desc: d }) => [d(p.paidAt)],
                    },
                },
            },
        },
    });

    if (!customerData) return null;

    const aggregates = await db
        .select({
            activeLoanCount: sql<number>`count(case when ${loans.status} != 'settled' then 1 end)`,
            totalLent: sql<string>`coalesce(sum(${loans.principalAmount}), 0)`,
        })
        .from(loans)
        .where(eq(loans.customerId, id));

    const balances = await db
        .select({
            outstandingBalance: sql<string>`coalesce(sum(${billingCycles.balance}), 0)`,
        })
        .from(billingCycles)
        .innerJoin(loans, eq(billingCycles.loanId, loans.id))
        .where(and(eq(loans.customerId, id), ne(billingCycles.status, 'closed')));

    return {
        ...customerData,
        activeLoanCount: Number(aggregates[0]?.activeLoanCount ?? 0),
        totalLent: aggregates[0]?.totalLent ?? "0",
        outstandingBalance: balances[0]?.outstandingBalance ?? "0",
    };
}

// ── Commands (with audit logging) ────────────────────────────────────────────

export async function createCustomerWithAudit(
    data: CustomerCreateInput & { userId: string }
) {
    return db.transaction(async (tx) => {
        const [customer] = await tx.insert(customers).values({
            name: data.name,
            phone: data.phone,
            notes: data.notes,
        }).returning();

        await tx.insert(auditLogs).values({
            userId: data.userId,
            action: "CUSTOMER_CREATED",
            entityType: "customer",
            entityId: customer.id,
            metadata: { after: customer },
        });

        return customer;
    });
}

export async function updateCustomerWithAudit(
    id: string,
    data: CustomerUpdateInput,
    userId: string
) {
    return db.transaction(async (tx) => {
        const beforeState = await tx.query.customers.findFirst({
            where: eq(customers.id, id),
        });
        if (!beforeState) throw new Error("Customer not found");

        const [afterState] = await tx
            .update(customers)
            .set({ name: data.name, phone: data.phone, notes: data.notes })
            .where(eq(customers.id, id))
            .returning();

        await tx.insert(auditLogs).values({
            userId,
            action: "CUSTOMER_UPDATED",
            entityType: "customer",
            entityId: id,
            metadata: { before: beforeState, after: afterState },
        });

        return afterState;
    });
}
