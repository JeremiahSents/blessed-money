"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/lib/types";
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, Download04Icon } from '@hugeicons/core-free-icons';
import Link from "next/link";

export default function PaymentsPage() {
    const { data, isLoading } = useQuery<{ data: Payment[] }>({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await fetch("/api/payments");
            if (!res.ok) throw new Error("Failed to fetch payments");
            return res.json();
        }
    });

    const exportCSV = () => {
        if (!data?.data) return;
        const headers = ["Date", "Customer", "Loan ID", "Amount", "Notes"];
        const rows: string[] = data.data.map((p) => {
            const customerName = p.loan?.customer?.name || "";
            return [
                formatDate(p.paidAt),
                `"${customerName}"`,
                p.loanId,
                p.amount,
                `"${p.note || ''}"`,
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
                title="Payment History"
                description="A complete chronological ledger of all payments received."
                action={
                    <Button variant="outline" onClick={exportCSV} disabled={!data?.data?.length}>
                        <HugeiconsIcon icon={Download04Icon} className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                }
            />

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Paid</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                                    <HugeiconsIcon icon={Loading02Icon} className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                                    No payments recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{formatDate(payment.paidAt)}</TableCell>
                                    <TableCell>
                                        {payment.loan?.customer?.id ? (
                                            <Link href={`/customers/${payment.loan.customer.id}`} className="hover:underline font-medium">
                                                {payment.loan.customer.name}
                                            </Link>
                                        ) : (
                                            <span className="font-medium">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +{formatCurrency(parseFloat(payment.amount))}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-sm max-w-[250px] truncate">
                                        {payment.note || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/loans/${payment.loanId}`}>
                                            <Button variant="ghost" size="sm">View Loan</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
