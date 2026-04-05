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
        <Link href={`/loans/${payment.loanId}`} className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition-transform">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={MoneyReceive01Icon} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                    {payment.loan?.customer?.name || "Unknown"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{formatDate(payment.paidAt)}</p>
                {payment.note && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{payment.note}</p>
                )}
            </div>

            {/* Amount */}
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                +{formatCurrency(parseFloat(payment.amount))}
            </p>
        </Link>
    );
}
