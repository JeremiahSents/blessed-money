import db from "@/core/db";
import { getSettingsByUserId, upsertSettings } from "@/core/repositories/settings-repository";

export async function getAppSettings(userId: string) {
  const settings = await getSettingsByUserId(userId);

  if (!settings) {
    const created = await db.transaction(async (tx) => {
      return upsertSettings(userId, { workingCapital: "0" }, tx);
    });
    return created;
  }

  return settings;
}

export async function updateAppSettings(
  userId: string,
  data: { workingCapital: string | number }
) {
  const workingCapital =
    typeof data.workingCapital === "number"
      ? data.workingCapital.toFixed(2)
      : String(data.workingCapital);

  return db.transaction(async (tx) => {
    return upsertSettings(userId, { workingCapital }, tx);
  });
}
