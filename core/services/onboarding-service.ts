import db from "@/core/db";
import { businesses, appSettings } from "@/core/db/schema";
import { updateAppSettings } from "./settings-service";

export async function createInitialBusiness(userId: string, data: { name: string, workingCapital: string }) {
    return await db.transaction(async (tx) => {
        const [newBusiness] = await tx.insert(businesses).values({
            userId,
            name: data.name,
        }).returning();

        // Initialize settings with working capital
        // We can use the service with the transaction if we modify it, 
        // but for simplicity we can insert directly or use the repository.
        // Let's just insert into appSettings directly here.

        const workingCapital = parseFloat(data.workingCapital.replace(/,/g, "")).toFixed(2);

        await tx.insert(appSettings).values({
            businessId: newBusiness.id,
            workingCapital: isNaN(parseFloat(workingCapital)) ? "0.00" : workingCapital,
        });

        return newBusiness;
    });
}
