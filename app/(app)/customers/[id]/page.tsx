"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from '@hugeicons/react';
import { 
    PencilEdit01Icon, 
    ArrowLeft01Icon, 
    TelephoneIcon, 
    Coins01Icon,
    Task01Icon,
    StarIcon,
    InformationCircleIcon,
    Calendar04Icon,
    Download01Icon,
    PlusSignIcon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/customers/customer-form";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { BillingCycle, Customer, LoanSummary } from "@/lib/types";

import { useState, use } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const customerAvatarUrls = [
    "https://nyc.cloud.appwrite.io/v1/storage/buckets/694f8728000d9f558482/files/694f89470031cae2d8a0/view?project=694f86f8000af20e3525",
    "https://nyc.cloud.appwrite.io/v1/storage/buckets/694f8728000d9f558482/files/694f88f40038fe6fa4f1/view?project=694f86f8000af20e3525",
    "https://nyc.cloud.appwrite.io/v1/storage/buckets/694f8728000d9f558482/files/694f88f20012413729ee/view?project=694f86f8000af20e3525",
    "https://nyc.cloud.appwrite.io/v1/storage/buckets/694f8728000d9f558482/files/694f88f7001cdd345d10/view?project=694f86f8000af20e3525",
    "https://nyc.cloud.appwrite.io/v1/storage/buckets/694f8728000d9f558482/files/694f894100313e47a10a/view?project=694f86f8000af20e3525",
];

function getAvatarIndex(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % customerAvatarUrls.length;
}

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery<{ data: Customer }>({
        queryKey: ['customer', params.id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${params.id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        }
    });

    const generateStatement = () => {
        if (!data?.data) return;
        const doc = new jsPDF();
        const customer = data.data;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Customer Statement", 14, 22);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${customer.name}`, 14, 32);
        doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 38);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 44);

        const loansData = (customer.loans || []).map((loan: LoanSummary) => [
            loan.id.slice(0, 8),
            formatCurrency(parseFloat(loan.principalAmount)),
            `${(parseFloat(loan.interestRate) * 100).toFixed(1)}%`,
            new Date(loan.startDate).toLocaleDateString(),
            loan.status,
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Loan ID', 'Principal', 'Rate', 'Started', 'Status']],
            body: loansData,
            theme: 'grid',
        });

        doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
    };

    if (isLoading) {
        return <DetailPageSkeleton />;
    }

    const customer = data?.data;
    if (!customer) return <div className="p-12 text-center">Customer not found.</div>;

    const loans = customer.loans || [];
    const avatarUrl = customerAvatarUrls[getAvatarIndex(customer.id || customer.name)];
    const totalPaid = loans.reduce((acc: number, l: LoanSummary) => acc + (l.billingCycles || []).reduce((lAcc: number, c: BillingCycle) => lAcc + parseFloat(c.totalPaid), 0), 0);
    const totalLent = parseFloat(customer.totalLent || "0");
    const balance = parseFloat(customer.outstandingBalance || "0");
    
    // Debtor Rating Logic
    const overdueCyclesCount = loans.reduce((acc: number, l: LoanSummary) => acc + (l.billingCycles || []).filter((c: BillingCycle) => c.status === 'overdue').length, 0);
    const settledRatio = loans.length > 0 ? loans.filter((l: LoanSummary) => l.status === 'settled').length / loans.length : 1;
    
    let rating = 5;
    if (overdueCyclesCount > 0) rating -= 1.5;
    if (settledRatio < 0.5 && loans.length > 2) rating -= 1;
    if (balance > totalLent * 1.5) rating -= 1;
    rating = Math.max(1, Math.min(5, rating));

    const ratingLabel = rating >= 4.5 ? "A+ Excellent" : rating >= 3.5 ? "B+ Good" : rating >= 2.5 ? "C Fair" : "D Poor";
    const customerFormDefaults = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? undefined,
        notes: customer.notes ?? undefined,
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
            {/* Header Section */}
            <div className="pt-8">
                <Link
                    href="/customers"
                    className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors mb-8"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 mr-2" />
                    Back to Customers
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Avatar className="w-16 h-16 shrink-0 rounded-2xl">
                            <AvatarImage src={avatarUrl} alt={customer.name} />
                            <AvatarFallback className="rounded-2xl bg-zinc-900 text-white text-xl font-semibold uppercase tracking-tighter">
                                {customer.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-1 capitalize">
                                {customer.name}
                            </h1>
                            <p className="text-xs font-semibold text-zinc-400 uppercase">
                                Customer since {formatDate(customer.createdAt!)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm"
                            className="h-10 rounded-xl px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                            onClick={() => setIsEditOpen(true)}
                        >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button 
                            variant="default"
                            size="sm"
                            className="h-10 rounded-xl px-4 bg-primary text-white hover:bg-primary/90 font-semibold border-none shadow-none"
                            onClick={() => window.location.href = `/loans/new?customer=${customer.id}`}
                        >
                            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                            New Loan
                        </Button>
                    </div>
                </div>
            </div>

            {/* Debtor Health & GMV */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white dark:bg-zinc-950 p-7 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-100/50 dark:shadow-none">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-zinc-400 mb-1 leading-none">Debtor Rating</p>
                            <h3 className={cn("text-2xl font-semibold tracking-tight", rating >= 3.5 ? "text-primary" : "text-zinc-900 dark:text-white")}>
                                {ratingLabel}
                            </h3>
                        </div>
                        <div className="flex items-center gap-0.5 pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <HugeiconsIcon 
                                    key={star} 
                                    icon={StarIcon} 
                                    className={cn("w-5 h-5", star <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 dark:text-zinc-800")} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-7 border-t border-zinc-100 dark:border-zinc-800">
                        <div>
                            <p className="text-[9px] font-semibold uppercase text-zinc-400 mb-2">Total Lent</p>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(totalLent)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase text-zinc-400 mb-2">Total Repaid</p>
                            <p className="text-sm font-semibold text-primary tabular-nums tracking-tight">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase text-zinc-400 mb-2">Outstanding</p>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-3 mb-4">
                        <HugeiconsIcon icon={TelephoneIcon} className="w-4 h-4 text-zinc-400" />
                        <p className="text-[10px] font-semibold uppercase text-zinc-400">Phone Number</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{customer.phone || "No phone provided"}</p>
                </div>
            </div>

            {/* Loans History */}
            <div className="space-y-16">
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                            <HugeiconsIcon icon={Task01Icon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Loan Portfolio</h2>
                        </div>
                        <Badge variant="outline" className="h-5 px-1.5 border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase">
                            {loans.length} Total Loans
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {loans.length > 0 ? (
                            loans.map((loan: LoanSummary) => {
                                const lTotalDue = (loan.billingCycles || []).reduce((acc: number, c: BillingCycle) => acc + parseFloat(c.totalDue), 0);
                                const lTotalPaid = (loan.billingCycles || []).reduce((acc: number, c: BillingCycle) => acc + parseFloat(c.totalPaid), 0);
                                const repaymentRate = lTotalDue > 0 ? (lTotalPaid / lTotalDue) * 100 : 0;
                                const isSettled = loan.status === 'settled';

                                return (
                                    <Link 
                                        key={loan.id}
                                        href={`/loans/${loan.id}`}
                                        className={cn(
                                            "group block p-[22px] rounded-[32px] border transition-all active:scale-[0.99]",
                                            isSettled 
                                                ? "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-500/5 dark:border-emerald-500/10 hover:border-emerald-200" 
                                                : loan.status === 'overdue'
                                                ? "bg-rose-50/30 border-rose-100/50 dark:bg-rose-500/5 dark:border-rose-500/10 hover:border-rose-200"
                                                : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:border-primary/20 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-tight">#{loan.id.slice(0, 8)}</span>
                                                    <Badge className={cn(
                                                        "text-[9px] px-2 py-0.5 h-4 font-bold uppercase border-none shadow-none",
                                                        isSettled ? "bg-emerald-500 text-white" : 
                                                        loan.status === 'overdue' ? "bg-rose-500 text-white" : 
                                                        "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                                    )}>
                                                        {loan.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-semibold uppercase overflow-hidden">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 whitespace-nowrap min-w-0 transition-colors",
                                                        isSettled ? "text-emerald-600/70" : loan.status === 'overdue' ? "text-rose-600/70" : "text-zinc-500"
                                                    )}>
                                                        <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{formatDate(loan.startDate)}</span>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 whitespace-nowrap min-w-0",
                                                        isSettled ? "text-emerald-700 dark:text-emerald-400" : loan.status === 'overdue' ? "text-rose-700 dark:text-rose-400" : "text-zinc-900 dark:text-white"
                                                    )}>
                                                        <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                                        <span className="truncate">{formatCurrency(parseFloat(loan.principalAmount))}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right min-w-[80px]">
                                                    <p className={cn(
                                                        "text-lg font-semibold tabular-nums leading-none mb-1.5",
                                                        repaymentRate >= 100 ? "text-emerald-500" : 
                                                        repaymentRate > 0 ? "text-primary" : "text-zinc-400"
                                                    )}>
                                                        {repaymentRate.toFixed(0)}%
                                                    </p>
                                                    <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight">Paid</p>
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                    isSettled ? "bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" :
                                                    loan.status === 'overdue' ? "bg-rose-100/50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white" :
                                                    "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:bg-primary group-hover:text-white"
                                                )}>
                                                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800">
                                <HugeiconsIcon icon={Task01Icon} className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
                                <p className="text-sm font-semibold text-zinc-400 uppercase">No active or previous loans</p>
                                <Button 
                                    variant="link" 
                                    className="text-primary font-semibold mt-2"
                                    onClick={() => window.location.href = `/loans/new?customer=${customer.id}`}
                                >
                                    Issue first loan
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {customer.notes && (
                    <section className="space-y-6">
                         <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-zinc-900 dark:text-white">
                            <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5" />
                            <h2 className="text-xl font-semibold">Internal Notes</h2>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 italic">
                            &quot;{customer.notes}&quot;
                        </div>
                    </section>
                )}

                <div className="pt-8 flex justify-center">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-600 font-semibold uppercase text-[10px] tracking-wide"
                        onClick={generateStatement}
                    >
                        <HugeiconsIcon icon={Download01Icon} className="w-3.5 h-3.5 mr-2" />
                        Download Full Statement
                    </Button>
                </div>
            </div>

            <CustomerForm
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                defaultValues={customerFormDefaults}
            />
        </div>
    );
}
