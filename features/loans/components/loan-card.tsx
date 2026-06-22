import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, displayStatus } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import type { LoanSummary } from "@/lib/types";

export function LoanCard({ loan }: { loan: LoanSummary }) {
    const isActive = loan.status === 'active';
    const isOverdue = loan.status === 'overdue';

    return (
        <Link href={`/loans/${loan.id}`}>
            <Card className="hover:border-border dark:hover:border-border transition-colors cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Loan: {formatCurrency(parseFloat(loan.principalAmount))}
                    </CardTitle>
                    <Badge
                        variant={isActive ? "default" : isOverdue ? "destructive" : "secondary"}
                    >
                        {displayStatus(loan.status)}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <div className="text-2xl font-semibold tracking-tight">
                                {(parseFloat(loan.interestRate) * 100).toFixed(1)}% / mo
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Started {formatDate(loan.startDate)}
                            </p>
                        </div>
                        <HugeiconsIcon icon={ArrowUpRight01Icon} className="w-5 h-5 text-muted-foreground group-hover:text-foreground dark:group-hover:text-primary-foreground transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
