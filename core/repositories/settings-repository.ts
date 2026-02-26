import db from "@/core/db";
import { appSettings } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getSettingsByUserId(userId: string, tx?: Tx) {
  const runner = tx ?? db;
  return runner.query.appSettings.findFirst({
    where: eq(appSettings.userId, userId),
  });
}

export async function upsertSettings(
  userId: string,
  data: { workingCapital: string },
  tx?: Tx
) {
  const runner = tx ?? db;
  const [record] = await runner
    .insert(appSettings)
    .values({ userId, workingCapital: data.workingCapital })
    .onConflictDoUpdate({
      target: appSettings.userId,
      set: { workingCapital: data.workingCapital },
    })
    .returning();

  return record;
}
