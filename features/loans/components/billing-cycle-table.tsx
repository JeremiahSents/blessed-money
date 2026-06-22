"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, displayStatus, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { HugeiconsIcon } from '@hugeicons/react';
import { 
    CheckmarkCircle02Icon, 
    Alert02Icon, 
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
                    ? "border-red-500/20 bg-red-50/10 dark:bg-red-500/5" 
                    : isClosed 
                        ? "border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 opacity-60"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm"
            )}
        >
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full text-left p-5"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-white">Round #{cycle.cycleNumber}</span>
                            <Badge
                                className={cn(
                                    "text-[9px] px-2 py-0 h-4 font-semibold uppercase tracking-tight border-none",
                                    isClosed ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" : 
                                    isOverdue ? "bg-red-500 text-white" : 
                                    "bg-emerald-500 text-white"
                                )}
                            >
                                {displayStatus(cycle.status)}
                            </Badge>
                        </div>
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase">{formatDate(cycle.cycleStartDate)} – {formatDate(cycle.cycleEndDate)}</p>
                    </div>
                    <div className="text-right">
                        <p className={cn(
                            "font-semibold text-base tabular-nums tracking-tight",
                            balance <= 0 ? "text-emerald-500" : "text-zinc-900 dark:text-white"
                        )}>
                            {formatCurrency(balance)}
                        </p>
                        <div className="flex items-center justify-end text-[10px] font-semibold text-zinc-400">
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
                    <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-zinc-400">Principal</p>
                            <p className="font-semibold text-zinc-900 dark:text-white text-xs">{formatCurrency(parseFloat(cycle.openingPrincipal))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-zinc-400">Interest</p>
                            <p className="font-semibold text-red-500 text-xs">+{formatCurrency(parseFloat(cycle.interestCharged))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-zinc-400">Total Due</p>
                            <p className="font-semibold text-zinc-900 dark:text-white text-xs">{formatCurrency(parseFloat(cycle.totalDue))}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-zinc-400">Paid Today</p>
                            <p className="font-semibold text-emerald-500 text-xs">-{formatCurrency(parseFloat(cycle.totalPaid))}</p>
                        </div>
                    </div>
                )}
            </button>
        </div>
    );
}

export function BillingCycleTable({ cycles = [] }: { cycles: BillingCycle[] }) {
    if (cycles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
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
