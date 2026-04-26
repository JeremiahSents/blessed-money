"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { getAvatarColor, getInitials } from "@/lib/utils";
import type { Customer } from "@/lib/types";

interface CustomerCardProps {
    customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
    const router = useRouter();
    const avatarColor = getAvatarColor(customer.name);
    const activeLoans = customer.activeLoanCount ?? customer.loans?.filter(l => l.status === "active" || l.status === "overdue").length ?? 0;

    return (
        <button
            onClick={() => router.push(`/customers/${customer.id}`)}
            className="w-full flex items-center gap-4 p-4 pr-3 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm shadow-zinc-100/60 dark:shadow-none active:scale-[0.99] transition-all text-left hover:border-primary/20 hover:shadow-md hover:shadow-zinc-100/80 dark:hover:shadow-none"
        >
            <Avatar className="w-11 h-11 shrink-0">
                <AvatarFallback className={`text-sm font-semibold ${avatarColor}`}>
                    {getInitials(customer.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">{customer.name}</p>
                    {!customer.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                    )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{customer.phone || "No phone"}</p>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 ml-auto">
                <div className="text-right min-w-[44px]">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400 leading-none">
                        Active Loans
                    </p>
                    <p className="text-base font-semibold text-primary tabular-nums leading-none mt-1">
                        {activeLoans}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200/70 dark:border-zinc-800">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-zinc-400" />
                </div>
            </div>
        </button>
    );
}
