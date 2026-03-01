import db from "@/core/db";
import { appSettings } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getSettingsByBusinessId(businessId: string, tx?: Tx) {
  const runner = tx ?? db;
  return runner.query.appSettings.findFirst({
    where: eq(appSettings.businessId, businessId),
  });
}

export async function upsertSettings(
  businessId: string,
  data: { workingCapital: string },
  tx?: Tx
) {
  const runner = tx ?? db;
  const [record] = await runner
    .insert(appSettings)
    .values({ businessId, workingCapital: data.workingCapital })
    .onConflictDoUpdate({
      target: appSettings.businessId,
      set: { workingCapital: data.workingCapital },
    })
    .returning();

  return record;
}
