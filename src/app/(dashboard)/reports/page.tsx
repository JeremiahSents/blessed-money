"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Loader2Icon, DownloadIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['reports-monthly'],
        queryFn: async () => {
            const res = await fetch("/api/reports/monthly");
            if (!res.ok) throw new Error("Failed to fetch reports");
            return res.json();
        }
    });

    const exportPDF = () => {
        if (!data?.data) return;
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Portfolio Performance Report", 14, 22);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const rows = data.data.map((m: any) => [
            m.month,
            m.loansIssuedCount.toString(),
            `$${m.loansIssuedPrincipal.toFixed(2)}`,
            `$${m.collected.toFixed(2)}`,
            `$${m.interestEarned.toFixed(2)}`,
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Month', 'Loans Issued', 'Principal Issued', 'Total Collected', 'Interest Scheduled']],
            body: rows,
            theme: 'grid',
        });

        doc.save(`Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
                title="Monthly Reports"
                description="Analyze your portfolio performance month over month."
                action={
                    <Button variant="outline" onClick={exportPDF} disabled={!data?.data?.length}>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export Report (PDF)
                    </Button>
                }
            />

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Loans Issued</TableHead>
                            <TableHead className="text-right">Principal Issued</TableHead>
                            <TableHead className="text-right">Total Collected</TableHead>
                            <TableHead className="text-right">Interest Scheduled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                                    <Loader2Icon className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                                    No historical data available yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((monthRecord: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="font-bold">{monthRecord.month}</TableCell>
                                    <TableCell className="text-right">{monthRecord.loansIssuedCount}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(monthRecord.loansIssuedPrincipal)}</TableCell>
                                    <TableCell className="text-right text-emerald-600 font-medium">
                                        {formatCurrency(monthRecord.collected)}
                                    </TableCell>
                                    <TableCell className="text-right text-blue-600 font-medium">
                                        {formatCurrency(monthRecord.interestEarned)}
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
