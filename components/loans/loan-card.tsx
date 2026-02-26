import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import type { LoanSummary } from "@/lib/types";

export function LoanCard({ loan }: { loan: LoanSummary }) {
    const isActive = loan.status === 'active';
    const isOverdue = loan.status === 'overdue';

    return (
        <Link href={`/loans/${loan.id}`}>
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-zinc-500">
                        Principal: {formatCurrency(parseFloat(loan.principalAmount))}
                    </CardTitle>
                    <Badge
                        variant={isActive ? "default" : isOverdue ? "destructive" : "secondary"}
                    >
                        {loan.status}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <div className="text-2xl font-bold tracking-tight">
                                {(parseFloat(loan.interestRate) * 100).toFixed(1)}% / mo
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                Started {formatDate(loan.startDate)}
                            </p>
                        </div>
                        <HugeiconsIcon icon={ArrowUpRight01Icon} className="w-5 h-5 text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
