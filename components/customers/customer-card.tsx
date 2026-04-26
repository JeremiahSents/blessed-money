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
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition-transform text-left"
        >
            {/* Avatar */}
            <Avatar className="w-11 h-11 shrink-0">
                <AvatarFallback className={`text-sm font-semibold ${avatarColor}`}>
                    {getInitials(customer.name)}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    {!customer.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                    )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{customer.phone || "No phone"}</p>
                {activeLoans > 0 && (
                    <p className="text-xs text-primary font-medium mt-0.5">{activeLoans} active loan{activeLoans > 1 ? "s" : ""}</p>
                )}
            </div>

            {/* Arrow */}
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-zinc-400 shrink-0" />
        </button>
    );
}
