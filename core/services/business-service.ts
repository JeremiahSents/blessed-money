import db from "@/core/db";
import { businesses } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export async function resolveBusinessForUser(userId: string) {
    let business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, userId),
    });

    if (!business) {
        const [newBusiness] = await db.insert(businesses).values({
            userId,
            name: "My Business",
        }).returning();
        business = newBusiness;
    }

    return business;
}
