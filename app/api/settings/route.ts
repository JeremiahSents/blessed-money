import { withAuth } from "@/lib/api";
import { getAppSettings, updateAppSettings } from "@/features/settings/service";

export const GET = withAuth(async () => ({ data: await getAppSettings() }));

export const PUT = withAuth(async ({ req }) => {
    const body = await req.json();
    return { data: await updateAppSettings({ workingCapital: body.workingCapital }) };
}, 400);
