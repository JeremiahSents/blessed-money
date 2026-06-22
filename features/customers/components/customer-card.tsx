"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/lib/types";

interface CustomerCardProps {
    customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
    const lifetimeValue = Number(customer.totalLent ?? 0);

    return (
        <Link
            href={`/customers/${customer.id}`}
            className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted"
        >
            <PersonAvatar seed={customer.id} name={customer.name} className="w-10 h-10 shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
                    {!customer.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate tabular-nums">
                    {customer.phone || "No phone"}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground tabular-nums leading-none">
                    {formatCurrency(lifetimeValue)}
                </p>
                <span className="text-[11px] font-medium text-primary leading-none mt-1 inline-block">
                    View more
                </span>
            </div>
        </Link>
    );
}
