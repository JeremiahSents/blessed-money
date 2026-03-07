import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { sendDailyReminders } from "@/core/services/cron-service";
import { sendDailyRemindersEmail } from "@/core/services/email-service";

export async function POST(req: NextRequest) {
    // Secured by CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await sendDailyReminders();
        return NextResponse.json({ message: "Daily reminders processed", ...result });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
