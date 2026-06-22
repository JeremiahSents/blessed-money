"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Customer } from "@/lib/types";

interface CustomerCardProps {
    customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
    const router = useRouter();
    const activeLoans = customer.activeLoanCount ?? customer.loans?.filter(l => l.status === "active" || l.status === "overdue").length ?? 0;

    return (
        <Button
            variant="ghost"
            onClick={() => router.push(`/customers/${customer.id}`)}
            className="h-auto w-full justify-start gap-4 p-4 pr-3 bg-card rounded-2xl border border-border shadow-sm active:scale-[0.99] transition-all text-left hover:bg-card hover:border-primary/20 hover:shadow-md"
        >
            <PersonAvatar seed={customer.id} name={customer.name} className="w-11 h-11 shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
                    {!customer.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{customer.phone || "No phone"}</p>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 ml-auto">
                <div className="text-right min-w-[44px]">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-none">
                        Active Loans
                    </p>
                    <p className="text-base font-semibold text-primary tabular-nums leading-none mt-1">
                        {activeLoans}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </Button>
    );
}
