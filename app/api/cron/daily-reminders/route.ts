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
        const url = new URL(req.url);
        const isMock = url.searchParams.get("mock") === "true";

        if (isMock) {
            const mockData = {
                businessName: "ShopVendly Mock Store",
                adminName: "Jeremiah (Admin)",
                adminEmail: "sentomerojeremy@gmail.com",
                duePayments: [
                    { customerName: "John Doe", amountDue: "150.00", loanId: "mock-loan-1" },
                    { customerName: "Jane Smith", amountDue: "75.50", loanId: "mock-loan-2" }
                ],
            };
            const result = await sendDailyRemindersEmail(mockData);
            return NextResponse.json({ message: "Mock email sent", ...result });
        }

        const result = await sendDailyReminders();
        return NextResponse.json({ message: "Daily reminders processed", ...result });
    } catch (err: unknown) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
}
