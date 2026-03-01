import db from "@/core/db";
import { businesses } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export async function resolveBusinessForUser(userId: string) {
    return db.query.businesses.findFirst({
        where: eq(businesses.userId, userId),
    });
}

export async function updateBusinessName(businessId: string, name: string) {
    const [updated] = await db.update(businesses).set({ name }).where(eq(businesses.id, businessId)).returning();
    return updated;
}
