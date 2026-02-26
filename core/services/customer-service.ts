import db from "@/core/db";
import { auditLogs } from "@/core/db/schema";
import {
    findManyCustomers,
    findCustomerById,
    createCustomer,
    updateCustomer,
    type CustomerCreateInput,
    type CustomerUpdateInput,
} from "@/core/repositories/customer-repository";

export async function listCustomers(opts: {
    search: string;
    page: number;
    limit: number;
}) {
    return findManyCustomers(opts);
}

export async function getCustomer(id: string) {
    return findCustomerById(id);
}

export async function createCustomerWithAudit(
    data: Omit<CustomerCreateInput, "userId"> & { userId: string }
) {
    return db.transaction(async (tx) => {
        const customer = await createCustomer(data, tx);

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
        const { beforeState, afterState } = await updateCustomer(id, data, tx);

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
