"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Customer } from "@/lib/types";

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
    const colors = [
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
        "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
        "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

interface CustomerCardProps {
    customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
    const router = useRouter();
    const initials = getInitials(customer.name);
    const avatarColor = getAvatarColor(customer.name);
    const activeLoans = customer.loans?.filter(l => l.status === "active" || l.status === "overdue").length ?? 0;

    return (
        <button
            onClick={() => router.push(`/customers/${customer.id}`)}
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 active:scale-[0.99] transition-transform text-left"
        >
            {/* Avatar */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor}`}>
                {initials}
            </div>

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
