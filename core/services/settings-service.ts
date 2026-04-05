import db from "@/core/db";
import { getSettings, upsertSettings } from "@/core/repositories/settings-repository";

export async function getAppSettings() {
  const settings = await getSettings();

  if (!settings) {
    return db.transaction(async (tx) => {
      return upsertSettings({ workingCapital: "0" }, tx);
    });
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

  return db.transaction(async (tx) => {
    return upsertSettings({ workingCapital }, tx);
  });
}
