import db from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SINGLETON_ID = "singleton";

async function upsertSettings(data: { workingCapital: string }, tx?: Tx) {
    const runner = tx ?? db;
    const [record] = await runner
        .insert(appSettings)
        .values({ id: SINGLETON_ID, workingCapital: data.workingCapital })
        .onConflictDoUpdate({
            target: appSettings.id,
            set: { workingCapital: data.workingCapital },
        })
        .returning();
    return record;
}

export async function getAppSettings() {
    const settings = await db.query.appSettings.findFirst({
        where: eq(appSettings.id, SINGLETON_ID),
    });

    if (!settings) {
        return db.transaction(async (tx) => upsertSettings({ workingCapital: "0" }, tx));
    }

    return settings;
}

export async function updateAppSettings(data: { workingCapital: string | number }) {
    let rawStr = typeof data.workingCapital === "number"
        ? data.workingCapital.toFixed(2)
        : String(data.workingCapital || "0");

    rawStr = rawStr.replace(/,/g, "").trim();
    const parsed = parseFloat(rawStr);
    const workingCapital = isNaN(parsed) ? "0" : parsed.toFixed(2);

    return db.transaction(async (tx) => upsertSettings({ workingCapital }, tx));
}
