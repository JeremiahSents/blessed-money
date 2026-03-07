import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PaymentDueInfo {
    customerName: string;
    amountDue: string;
    loanId: string;
}

interface DailyReminderData {
    businessName: string;
    adminName: string;
    adminEmail: string;
    duePayments: PaymentDueInfo[];
}

export async function sendDailyRemindersEmail(data: DailyReminderData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Skipping email send.");
        return { data: null, error: { message: "RESEND_API_KEY is not set", name: "MissingApiKey" } };
    }

    const { businessName, adminName, adminEmail, duePayments } = data;

    // Create the email HTML content
    const paymentsHtmlList = duePayments.map(p => `
        <li style="margin-bottom: 10px;">
            <strong>Customer:</strong> ${p.customerName}<br/>
            <strong>Amount Due:</strong> GHS ${p.amountDue}<br/>
            <strong>Loan ID:</strong> ${p.loanId}
        </li>
    `).join("");

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Daily Payment Reminders - ${businessName}</h2>
            <p>Hello ${adminName},</p>
            <p>This is your daily reminder that the following customers have payments due today:</p>
            <ul style="list-style-type: none; padding-left: 0;">
                ${paymentsHtmlList}
            </ul>
            <p>Please log in to your dashboard to manage these payments.</p>
            <p>Best regards,<br/>The ${businessName} Team</p>
        </div>
    `;

    try {
        const { data: responseData, error } = await resend.emails.send({
            from: "payments@shopvendly.store",
            to: [adminEmail],
            subject: `[${businessName}] Daily Payments Due Reminder`,
            html: htmlContent,
        });

        if (error) {
            console.error("Failed to send daily reminder email to admin:", error);
        }

        return { data: responseData, error };
    } catch (err: any) {
        console.error("Unexpected error sending email via Resend:", err);
        return { data: null, error: { message: err.message || "Unknown error", name: "UnexpectedError" } };
    }
}
