"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, displayStatus, cn } from "@/lib/utils";
import { HugeiconsIcon } from '@hugeicons/react';
import { 
    Clock01Icon, 
    ArrowDown01Icon, 
    ArrowUp01Icon 
} from '@hugeicons/core-free-icons';
import type { BillingCycle } from "@/lib/types";

function BillingCycleCard({ cycle }: { cycle: BillingCycle }) {
    const [expanded, setExpanded] = useState(cycle.status !== 'closed');
    const balance = parseFloat(cycle.balance);
    const isOverdue = cycle.status === 'overdue';
    const isClosed = cycle.status === 'closed';

    return (
        <div 
            className={cn(
                "w-full rounded-2xl border transition-all duration-200",
                isOverdue 
                    ? "border-destructive/30 bg-destructive/10" 
                    : isClosed 
                        ? "border-border bg-muted opacity-60"
                        : "border-border bg-card shadow-sm"
            )}
        >
            <Button
                variant="ghost"
                onClick={() => setExpanded(v => !v)}
                className="h-auto w-full flex-col items-stretch justify-start text-left p-5 hover:bg-transparent"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">Round #{cycle.cycleNumber}</span>
                            <Badge
                                className={cn(
                                    "text-[9px] px-2 py-0 h-4 font-semibold uppercase tracking-tight border-none",
                                    isClosed ? "bg-muted text-muted-foreground" : 
                                    isOverdue ? "bg-destructive text-primary-foreground" : 
                                    "bg-success text-primary-foreground"
                                )}
                            >
                                {displayStatus(cycle.status)}
                            </Badge>
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">{formatDate(cycle.cycleStartDate)} – {formatDate(cycle.cycleEndDate)}</p>
                    </div>
                    <div className="text-right">
                        <p className={cn(
                            "font-semibold text-base tabular-nums tracking-tight",
                            balance <= 0 ? "text-success" : "text-foreground"
                        )}>
                            {formatCurrency(balance)}
                        </p>
                        <div className="flex items-center justify-end text-[10px] font-semibold text-muted-foreground">
                            {expanded ? (
                                <HugeiconsIcon icon={ArrowUp01Icon} className="w-3 h-3" />
                            ) : (
                                <HugeiconsIcon icon={ArrowDown01Icon} className="w-3 h-3" />
                            )}
                            <span className="ml-1 uppercase">{expanded ? "Less" : "Details"}</span>
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Principal</p>
                            <p className="font-semibold text-foreground text-xs">{formatCurrency(parseFloat(cycle.openingPrincipal))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Interest</p>
                            <p className="font-semibold text-destructive text-xs">+{formatCurrency(parseFloat(cycle.interestCharged))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Total Due</p>
                            <p className="font-semibold text-foreground text-xs">{formatCurrency(parseFloat(cycle.totalDue))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Paid Today</p>
                            <p className="font-semibold text-success text-xs">-{formatCurrency(parseFloat(cycle.totalPaid))}</p>
                        </div>
                    </div>
                )}
            </Button>
        </div>
    );
}

export function BillingCycleTable({ cycles = [] }: { cycles: BillingCycle[] }) {
    if (cycles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium italic">No payment rounds have been generated yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {cycles.map(cycle => <BillingCycleCard key={cycle.id} cycle={cycle} />)}
        </div>
    );
}
