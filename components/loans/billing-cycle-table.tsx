"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/lib/types";

function BillingCycleCard({ cycle }: { cycle: BillingCycle }) {
    const [expanded, setExpanded] = useState(cycle.status !== 'closed');
    const balance = parseFloat(cycle.balance);

    return (
        <button
            onClick={() => setExpanded(v => !v)}
            className={cn(
                "w-full text-left rounded-xl border p-4 transition-colors",
                cycle.status === 'overdue'
                    ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                    : cycle.status === 'closed'
                        ? "border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            )}
        >
            {/* Header row — always visible */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Cycle #{cycle.cycleNumber}</span>
                    <Badge
                        variant={cycle.status === 'closed' ? "secondary" : cycle.status === 'overdue' ? "destructive" : "default"}
                        className="text-[10px] px-1.5 py-0"
                    >
                        {cycle.status}
                    </Badge>
                </div>
                <span className={cn("font-bold text-sm", balance <= 0 ? "text-emerald-600" : "text-foreground")}>
                    {formatCurrency(balance)}
                </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{formatDate(cycle.cycleStartDate)} – {formatDate(cycle.cycleEndDate)}</p>

            {/* Expanded details */}
            {expanded && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                        <p className="text-zinc-400">Opening</p>
                        <p className="font-medium">{formatCurrency(parseFloat(cycle.openingPrincipal))}</p>
                    </div>
                    <div>
                        <p className="text-zinc-400">Interest</p>
                        <p className="font-medium text-red-500">+{formatCurrency(parseFloat(cycle.interestCharged))}</p>
                    </div>
                    <div>
                        <p className="text-zinc-400">Total Due</p>
                        <p className="font-medium">{formatCurrency(parseFloat(cycle.totalDue))}</p>
                    </div>
                    <div>
                        <p className="text-zinc-400">Paid</p>
                        <p className="font-medium text-emerald-600">-{formatCurrency(parseFloat(cycle.totalPaid))}</p>
                    </div>
                </div>
            )}
        </button>
    );
}

export function BillingCycleTable({ cycles = [] }: { cycles: BillingCycle[] }) {
    const isMobile = useIsMobile();

    if (cycles.length === 0) {
        return <div className="text-zinc-500 text-sm p-4 border rounded-md bg-zinc-50">No billing cycles defined.</div>;
    }

    if (isMobile) {
        return (
            <div className="space-y-2">
                {cycles.map(cycle => <BillingCycleCard key={cycle.id} cycle={cycle} />)}
            </div>
        );
    }

    return (
        <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cycle</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cycles.map((cycle) => (
                        <TableRow key={cycle.id}>
                            <TableCell className="font-medium">#{cycle.cycleNumber}</TableCell>
                            <TableCell className="text-xs text-zinc-500">
                                {formatDate(cycle.cycleStartDate)} - {formatDate(cycle.cycleEndDate)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(cycle.openingPrincipal))}</TableCell>
                            <TableCell className="text-right text-red-500">+{formatCurrency(parseFloat(cycle.interestCharged))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(parseFloat(cycle.totalDue))}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-medium">-{formatCurrency(parseFloat(cycle.totalPaid))}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(parseFloat(cycle.balance))}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={cycle.status === 'closed' ? "secondary" : cycle.status === 'overdue' ? "destructive" : "default"}
                                >
                                    {cycle.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
