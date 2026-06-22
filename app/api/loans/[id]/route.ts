import { withAuth } from "@/lib/api";
import { getLoan } from "@/features/loans/service";

export const GET = withAuth(async ({ params }) => {
    const loan = await getLoan(params.id);
    if (!loan) throw new Error("Loan not found");
    return { data: loan };
});
