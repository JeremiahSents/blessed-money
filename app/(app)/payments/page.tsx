"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowRight01Icon,
    Download04Icon,
    PlusSignIcon,
    UserIcon,
    Coins01Icon,
    UserMultipleIcon,
    ArrowUp01Icon,
    ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, formatDate, getAvatarColor, getInitials } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import type { Payment } from "@/lib/types";

interface ActiveLoan {
    id: string;
    principalAmount: string;
    interestRate: string;
    status: "active" | "overdue" | "settled";
    customer: { id: string; name: string; phone: string | null };
    billingCycles: Array<{
        id: string;
        totalDue: string;
        totalPaid: string;
        balance: string;
        status: string;
    }>;
}

type PaymentWithMeta = Payment & {
    amountNumber: number;
    customerName: string;
    customerId: string | null;
};

const paymentSchema = z.object({
    loanId: z.string().min(1, "Select a loan"),
    amount: z.string().min(1, "Amount is required"),
    paidAt: z.string().min(1, "Date is required"),
    note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function toDayKey(dateValue: string | Date) {
    return new Date(dateValue).toISOString().split("T")[0];
}

function getMonthKey(dateValue: Date) {
    return `${dateValue.getFullYear()}-${dateValue.getMonth()}`;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Record Payment Dialog                                         */
/* ──────────────────────────────────────────────────────────────── */

function RecordPaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const queryClient = useQueryClient();

    const { data: loansData, isLoading: loansLoading } = useQuery<{ data: ActiveLoan[] }>({
        queryKey: ["loans-active-for-payment"],
        queryFn: async () => {
            const res = await fetch("/api/loans?limit=200");
            return res.json();
        },
        enabled: open,
    });

    const activeLoans = loansData?.data?.filter((loan) => {
        if (loan.status === "settled") return false;
        const cycle = loan.billingCycles?.[0];
        if (!cycle) return false;
        return parseFloat(cycle.balance) > 0;
    }) ?? [];

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { loanId: "", amount: "", paidAt: new Date().toISOString().split("T")[0], note: "" },
    });

    const selectedLoanId = useWatch({ control: form.control, name: "loanId" });
    const amountStr = useWatch({ control: form.control, name: "amount" });

    const selectedLoan = activeLoans.find((loan) => loan.id === selectedLoanId);
    const activeCycle = selectedLoan?.billingCycles?.find((cycle) => cycle.status === "open" || cycle.status === "overdue");
    const balanceCents = activeCycle ? parseFloat(activeCycle.balance) : 0;
    const enteredAmount = parseFloat(amountStr.replace(/,/g, "")) || 0;
    const remaining = Math.max(0, balanceCents - enteredAmount);
    const isFullPayment = enteredAmount > 0 && enteredAmount >= balanceCents;

    const mutation = useMutation({
        mutationFn: async (values: PaymentFormValues) => {
            const res = await fetch(`/api/loans/${values.loanId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: values.amount.replace(/,/g, ""), paidAt: values.paidAt, note: values.note }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to record payment");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["loans"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success("Payment recorded successfully");
            onOpenChange(false);
            form.reset();
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);
                if (!v) form.reset();
            }}
            title="Collect Payment"
            description="Select the active loan, record the amount received, and keep the ledger current."
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4 mt-2">
                    <FormField
                        control={form.control}
                        name="loanId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer / Loan <span className="text-red-500">*</span></FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full h-11 px-3 gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
                                        <HugeiconsIcon icon={UserIcon} className="size-4 text-zinc-400 shrink-0" />
                                        <span className="flex-1 text-left truncate text-sm">
                                            {selectedLoan
                                                ? `${selectedLoan.customer.name} - ${formatCurrency(parseFloat(selectedLoan.billingCycles?.find((cycle) => cycle.status !== "closed")?.balance ?? "0"))} due`
                                                : <span className="text-zinc-400">Select a loan...</span>}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-h-64">
                                        {loansLoading ? (
                                            <div className="py-4 text-center text-sm text-zinc-400">Loading...</div>
                                        ) : activeLoans.length === 0 ? (
                                            <div className="py-4 text-center text-sm text-zinc-400">No active loans found</div>
                                        ) : (
                                            <SelectGroup>
                                                <SelectLabel className="px-3 py-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">Running / Late Loans</SelectLabel>
                                                {activeLoans.map((loan) => {
                                                    const cycle = loan.billingCycles?.find((billingCycle) => billingCycle.status === "open" || billingCycle.status === "overdue");
                                                    const balance = cycle ? parseFloat(cycle.balance) : 0;
                                                    return (
                                                        <SelectItem key={loan.id} value={loan.id} className="mx-1 rounded-lg">
                                                            <span className="flex items-center justify-between w-full gap-3">
                                                                <span className="flex flex-col">
                                                                    <span className="font-medium">{loan.customer.name}</span>
                                                                    <span className="text-xs text-zinc-400">{loan.customer.phone || "No phone"} · {(parseFloat(loan.interestRate) * 100).toFixed(0)}%/mo</span>
                                                                </span>
                                                                <span className={cn("text-xs font-semibold shrink-0", loan.status === "overdue" ? "text-red-500" : "text-emerald-600")}>
                                                                    {formatCurrency(balance)} due
                                                                </span>
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectGroup>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {activeCycle && (
                        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 grid grid-cols-3 gap-2 text-center text-sm">
                            <div>
                                <p className="text-xs text-zinc-400 mb-0.5">Total Due</p>
                                <p className="font-semibold">{formatCurrency(parseFloat(activeCycle.totalDue))}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 mb-0.5">Already Paid</p>
                                <p className="font-semibold text-emerald-600">{formatCurrency(parseFloat(activeCycle.totalPaid))}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 mb-0.5">Balance</p>
                                <p className="font-semibold text-red-500">{formatCurrency(balanceCents)}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (UGX) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="50,000"
                                            {...field}
                                            onChange={(e) => {
                                                const rawValue = e.target.value;
                                                const clean = rawValue.replace(/,/g, "");
                                                const parts = clean.split(".");
                                                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                field.onChange(parts.join("."));
                                            }}
                                        />
                                    </FormControl>
                                    {activeCycle && balanceCents > 0 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="w-full mt-2 text-xs h-8"
                                            onClick={() => {
                                                const formatted = balanceCents.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                form.setValue("amount", formatted);
                                            }}
                                        >
                                            Pay Full Amount
                                        </Button>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paidAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date Paid</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {activeCycle && enteredAmount > 0 && (
                        <div className={cn(
                            "rounded-xl p-3 flex items-center justify-between text-sm font-medium",
                            isFullPayment
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                        )}>
                            <span>{isFullPayment ? "Fully clears the balance" : "Partial payment - remaining balance:"}</span>
                            {!isFullPayment && <span className="font-semibold">{formatCurrency(remaining)}</span>}
                        </div>
                    )}

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Note (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Mobile money ref, bank transfer ID..." rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending || !selectedLoanId}>
                            {mutation.isPending ? "Saving..." : "Save Payment"}
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveModal>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Main Page                                                      */
/* ──────────────────────────────────────────────────────────────── */

export default function PaymentsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const isMobile = useIsMobile();

    const { data, isLoading } = useQuery<{ data: Payment[] }>({
        queryKey: ["payments"],
        queryFn: async () => {
            const res = await fetch("/api/payments");
            if (!res.ok) throw new Error("Failed to fetch payments");
            return res.json();
        },
    });

    const paymentMetrics = useMemo(() => {
        const payments = data?.data || [];
        const enriched: PaymentWithMeta[] = payments.map((payment) => ({
            ...payment,
            amountNumber: parseFloat(payment.amount),
            customerName: payment.loan?.customer?.name || "Unknown customer",
            customerId: payment.loan?.customer?.id || null,
        }));

        const now = new Date();
        const todayKey = toDayKey(now);
        const currentMonthKey = getMonthKey(now);
        const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthKey = getMonthKey(previousMonthDate);

        const collectedToday = enriched
            .filter((payment) => toDayKey(payment.paidAt) === todayKey)
            .reduce((sum, payment) => sum + payment.amountNumber, 0);

        const thisMonthPayments = enriched.filter((payment) => getMonthKey(new Date(payment.paidAt)) === currentMonthKey);
        const previousMonthPayments = enriched.filter((payment) => getMonthKey(new Date(payment.paidAt)) === previousMonthKey);

        const collectedThisMonth = thisMonthPayments.reduce((sum, payment) => sum + payment.amountNumber, 0);
        const collectedLastMonth = previousMonthPayments.reduce((sum, payment) => sum + payment.amountNumber, 0);
        const monthCount = thisMonthPayments.length;
        const avgPayment = monthCount > 0 ? collectedThisMonth / monthCount : 0;
        const uniquePayers = new Set(thisMonthPayments.map((payment) => payment.customerId || payment.customerName)).size;

        const monthDelta = collectedLastMonth > 0
            ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100
            : collectedThisMonth > 0
                ? 100
                : 0;

        // Top payer this month
        const payerMap = new Map<string, { name: string; total: number }>();
        thisMonthPayments.forEach((payment) => {
            const key = payment.customerId || payment.customerName;
            const existing = payerMap.get(key) || { name: payment.customerName, total: 0 };
            existing.total += payment.amountNumber;
            payerMap.set(key, existing);
        });
        const topPayer = Array.from(payerMap.values()).sort((a, b) => b.total - a.total)[0] || null;

        return {
            enriched,
            collectedToday,
            collectedThisMonth,
            monthCount,
            avgPayment,
            uniquePayers,
            monthDelta,
            topPayer,
        };
    }, [data?.data]);

    const exportCSV = () => {
        const payments = data?.data || [];
        if (!payments.length) return;
        const headers = ["Date", "Customer", "Loan ID", "Amount", "Notes"];
        const rows = payments.map((payment) => [
            formatDate(payment.paidAt),
            `"${payment.loan?.customer?.name || ""}"`,
            payment.loanId,
            payment.amount,
            `"${payment.note || ""}"`,
        ].join(","));
        const csvContent = `data:text/csv;charset=utf-8,${headers.join(",")}\n${rows.join("\n")}`;
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `payments_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deltaPositive = paymentMetrics.monthDelta >= 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-36 md:pb-8 px-4 sm:px-6">
            <PageHeader
                title="Payments"
                description="Track incoming cash and spot collection patterns."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportCSV} disabled={!data?.data?.length} className={isMobile ? "hidden" : ""}>
                            <HugeiconsIcon icon={Download04Icon} className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button variant="outline" size="icon" onClick={exportCSV} disabled={!data?.data?.length} className={isMobile ? "" : "hidden"} title="Export CSV">
                            <HugeiconsIcon icon={Download04Icon} className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setDialogOpen(true)} className="hidden md:flex h-11 px-6 rounded-2xl bg-primary text-white hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                            Collect Payment
                        </Button>
                    </div>
                }
            />

            <RecordPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />

            {/* ── Bento Stats Grid ──────────────────────────────────── */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <Skeleton className="col-span-2 h-36 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {/* Hero — Collected This Month */}
                    <Card className="col-span-2 rounded-2xl bg-linear-to-br from-primary to-primary/85 text-primary-foreground border-0 overflow-hidden relative">
                        <div aria-hidden className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                        <div aria-hidden className="absolute -right-12 -bottom-12 w-52 h-52 rounded-full bg-white/5 blur-3xl" />
                        <CardContent className="p-5 md:p-6 relative">
                            <div className="flex items-center gap-2 text-primary-foreground/80">
                                <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4" />
                                <p className="text-sm font-medium">Collected This Month</p>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums tracking-tight">
                                {formatCurrency(paymentMetrics.collectedThisMonth)}
                            </p>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
                                    {paymentMetrics.monthCount} payment{paymentMetrics.monthCount === 1 ? "" : "s"}
                                </span>
                                <span className={cn(
                                    "inline-flex items-center gap-1 text-xs font-semibold bg-white/15 backdrop-blur rounded-full px-2.5 py-1",
                                )}>
                                    <HugeiconsIcon icon={deltaPositive ? ArrowUp01Icon : ArrowDown01Icon} className="w-3 h-3" />
                                    {Math.abs(paymentMetrics.monthDelta).toFixed(0)}% vs last month
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Payment */}
                    <Card className="col-span-1 rounded-2xl">
                        <CardContent className="p-4 md:p-5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4" />
                                <p className="text-xs md:text-sm font-medium">Average</p>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-foreground mt-2 tabular-nums">
                                {formatCurrency(paymentMetrics.avgPayment)}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Per transaction</p>
                        </CardContent>
                    </Card>

                    {/* Active Payers */}
                    <Card className="col-span-1 rounded-2xl">
                        <CardContent className="p-4 md:p-5">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HugeiconsIcon icon={UserMultipleIcon} className="w-4 h-4" />
                                <p className="text-xs md:text-sm font-medium">Payers</p>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-foreground mt-2 tabular-nums">
                                {paymentMetrics.uniquePayers}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Active this month</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Inline Stat Pills ─────────────────────────────────── */}
            {!isLoading && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Today: {formatCurrency(paymentMetrics.collectedToday)}
                    </span>
                    {paymentMetrics.topPayer && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[320px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Top: {paymentMetrics.topPayer.name} — {formatCurrency(paymentMetrics.topPayer.total)}
                        </span>
                    )}
                </div>
            )}

            {/* ── Payment List ──────────────────────────────────────── */}
            {isMobile ? (
                /* ── Mobile: Compact Payment Cards ── */
                <div className="space-y-2">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-24 rounded-md" />
                                    <Skeleton className="h-3 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-5 w-20 rounded-md" />
                            </div>
                        ))
                    ) : paymentMetrics.enriched.length === 0 ? (
                        <p className="py-12 text-center text-zinc-500">No payments recorded yet.</p>
                    ) : (
                        paymentMetrics.enriched.map((payment) => (
                            <Link
                                key={payment.id}
                                href={`/loans/${payment.loanId}`}
                                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 active:scale-[0.99] transition-all"
                            >
                                <Avatar className="w-10 h-10 shrink-0">
                                    <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(payment.customerName))}>
                                        {getInitials(payment.customerName)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                        {payment.customerName}
                                    </p>
                                    <p className="text-xs text-zinc-400">{formatDate(payment.paidAt)}</p>
                                </div>

                                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                                    +{formatCurrency(payment.amountNumber)}
                                </p>
                            </Link>
                        ))
                    )}
                </div>
            ) : (
                /* ── Desktop: Clean Table ── */
                <Card className="rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                                <TableHead className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Date</TableHead>
                                <TableHead className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Customer</TableHead>
                                <TableHead className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Amount</TableHead>
                                <TableHead className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-zinc-100/80 dark:border-zinc-800/80">
                                        <TableCell className="px-5 py-4"><Skeleton className="h-4 w-20 rounded-md" /></TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                                <Skeleton className="h-4 w-28 rounded-md" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4"><Skeleton className="h-4 w-24 rounded-md" /></TableCell>
                                        <TableCell className="px-5 py-4 text-right"><Skeleton className="h-8 w-20 rounded-full inline-block" /></TableCell>
                                    </TableRow>
                                ))
                            ) : paymentMetrics.enriched.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center text-zinc-500">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paymentMetrics.enriched.map((payment) => (
                                    <TableRow key={payment.id} className="border-zinc-100/80 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                                        <TableCell className="px-5 py-4 text-sm font-medium text-zinc-500 tabular-nums whitespace-nowrap">
                                            {formatDate(payment.paidAt)}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="w-9 h-9 shrink-0">
                                                    <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(payment.customerName))}>
                                                        {getInitials(payment.customerName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    {payment.customerId ? (
                                                        <Link href={`/customers/${payment.customerId}`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:text-primary transition-colors truncate block text-sm">
                                                            {payment.customerName}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-50 block text-sm">{payment.customerName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                                                +{formatCurrency(payment.amountNumber)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-right">
                                            <Link href={`/loans/${payment.loanId}`}>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1">
                                                    View Loan
                                                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* ── Mobile FAB ────────────────────────────────────────── */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-4 pt-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800">
                <Button className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-all" onClick={() => setDialogOpen(true)}>
                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                    Collect Payment
                </Button>
            </div>
        </div>
    );
}
