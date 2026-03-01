import db from "@/core/db";
import { getSettingsByBusinessId, upsertSettings } from "@/core/repositories/settings-repository";

export async function getAppSettings(businessId: string) {
  const settings = await getSettingsByBusinessId(businessId);

  if (!settings) {
    const created = await db.transaction(async (tx) => {
      return upsertSettings(businessId, { workingCapital: "0" }, tx);
    });
    return created;
  }

  return settings;
}

export async function updateAppSettings(
  businessId: string,
  data: { workingCapital: string | number }
) {
  // Sanitize the input - remove commas and characters, just keep numbers and decimals
  let rawStr = typeof data.workingCapital === "number"
    ? data.workingCapital.toFixed(2)
    : String(data.workingCapital || "0");

  rawStr = rawStr.replace(/,/g, "").trim();
  const parsed = parseFloat(rawStr);
  const workingCapital = isNaN(parsed) ? "0" : parsed.toFixed(2);

  return db.transaction(async (tx) => {
    return upsertSettings(businessId, { workingCapital }, tx);
  });
}
