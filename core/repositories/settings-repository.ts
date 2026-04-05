import db from "@/core/db";
import { appSettings } from "@/core/db/schema";
import { eq } from "drizzle-orm";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SINGLETON_ID = "singleton";

export async function getSettings(tx?: Tx) {
  const runner = tx ?? db;
  return runner.query.appSettings.findFirst({
    where: eq(appSettings.id, SINGLETON_ID),
  });
}

export async function upsertSettings(
  data: { workingCapital: string },
  tx?: Tx
) {
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
