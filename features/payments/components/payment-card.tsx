"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyReceive01Icon } from "@hugeicons/core-free-icons";
import type { Payment } from "@/lib/types";

interface PaymentCardProps {
    payment: Payment;
}

export function PaymentCard({ payment }: PaymentCardProps) {
    return (
        <Link href={`/loans/${payment.loanId}`} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border active:scale-[0.99] transition-transform">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={MoneyReceive01Icon} className="w-5 h-5 text-success" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                    {payment.loan?.customer?.name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(payment.paidAt)}</p>
                {payment.note && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{payment.note}</p>
                )}
            </div>

            {/* Amount */}
            <p className="font-semibold text-success text-sm shrink-0">
                +{formatCurrency(parseFloat(payment.amount))}
            </p>
        </Link>
    );
}
