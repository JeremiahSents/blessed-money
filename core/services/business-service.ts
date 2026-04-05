import db from "@/core/db";
import { businesses, user as userTable } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export async function resolveBusinessForUser(userId: string) {
    // Check if user owns a business
    const ownedBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, userId),
    });
    if (ownedBusiness) return ownedBusiness;

    // Admins get access to the one shared business
    const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) });
    if (!userRecord?.isAdmin) return null;

    return db.query.businesses.findFirst();
}

export async function updateBusinessName(businessId: string, name: string) {
    const [updated] = await db.update(businesses).set({ name }).where(eq(businesses.id, businessId)).returning();
    return updated;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
    const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) });
    return userRecord?.isAdmin ?? false;
}

export async function setUserAdminRole(targetUserId: string, isAdmin: boolean) {
    const [updated] = await db.update(userTable)
        .set({ isAdmin })
        .where(eq(userTable.id, targetUserId))
        .returning();
    return updated;
}

export async function listAllUsers() {
    return db.query.user.findMany({
        columns: { id: true, name: true, email: true, image: true, isAdmin: true, createdAt: true },
    });
}
