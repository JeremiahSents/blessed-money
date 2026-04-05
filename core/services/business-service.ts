import db from "@/core/db";
import { user as userTable } from "@/core/db/schema";
import { eq } from "drizzle-orm";

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
