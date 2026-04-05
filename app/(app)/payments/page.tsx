"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { PaymentCard } from "@/components/payments/payment-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import type { Payment } from "@/lib/types";
import { HugeiconsIcon } from '@hugeicons/react';
import { Download04Icon, PlusSignIcon, UserIcon } from '@hugeicons/core-free-icons';
import Link from "next/link";
import { toast } from "sonner";

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

const paymentSchema = z.object({
    loanId: z.string().min(1, "Select a loan"),
    amount: z.string().min(1, "Amount is required"),
    paidAt: z.string().min(1, "Date is required"),
    note: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

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

    // Only show loans that still have an outstanding balance
    const activeLoans = loansData?.data?.filter(l => {
        if (l.status === "settled") return false;
        const cycle = l.billingCycles?.[0];
        if (!cycle) return false;
        return parseFloat(cycle.balance) > 0;
    }) ?? [];

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: { loanId: "", amount: "", paidAt: new Date().toISOString().split("T")[0], note: "" },
    });

    const selectedLoanId = form.watch("loanId");
    const amountStr = form.watch("amount");

    const selectedLoan = activeLoans.find(l => l.id === selectedLoanId);
    const activeCycle = selectedLoan?.billingCycles?.find(c => c.status === "open" || c.status === "overdue");
    const balanceCents = activeCycle ? parseFloat(activeCycle.balance) : 0;
    const enteredAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
    const remaining = Math.max(0, balanceCents - enteredAmount);
    const isFullPayment = enteredAmount > 0 && enteredAmount >= balanceCents;

    const mutation = useMutation({
        mutationFn: async (values: PaymentFormValues) => {
            const res = await fetch(`/api/loans/${values.loanId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: values.amount.replace(/,/g, ''), paidAt: values.paidAt, note: values.note }),
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
            onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset(); }}
            title="Collect Payment"
            description="Select a loan and enter the amount received. Partial payments are supported."
        >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-4 mt-2">

                        {/* Loan picker */}
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
                                                    ? `${selectedLoan.customer.name} — ${formatCurrency(parseFloat(selectedLoan.billingCycles?.find(c => c.status !== "closed")?.balance ?? "0"))} due`
                                                    : <span className="text-zinc-400">Select a loan…</span>
                                                }
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-h-64">
                                            {loansLoading ? (
                                                <div className="py-4 text-center text-sm text-zinc-400">Loading…</div>
                                            ) : activeLoans.length === 0 ? (
                                                <div className="py-4 text-center text-sm text-zinc-400">No active loans found</div>
                                            ) : (
                                                <SelectGroup>
                                                    <SelectLabel className="px-3 py-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">Running / Late Loans</SelectLabel>
                                                    {activeLoans.map(loan => {
                                                        const cycle = loan.billingCycles?.find(c => c.status === "open" || c.status === "overdue");
                                                        const balance = cycle ? parseFloat(cycle.balance) : 0;
                                                        return (
                                                            <SelectItem key={loan.id} value={loan.id} className="mx-1 rounded-lg">
                                                                <span className="flex items-center justify-between w-full gap-3">
                                                                    <span className="flex flex-col">
                                                                        <span className="font-medium">{loan.customer.name}</span>
                                                                        <span className="text-xs text-zinc-400">{loan.customer.phone || "No phone"} · {(parseFloat(loan.interestRate) * 100).toFixed(0)}%/mo</span>
                                                                    </span>
                                                                    <span className={`text-xs font-semibold shrink-0 ${loan.status === "overdue" ? "text-red-500" : "text-emerald-600"}`}>
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

                        {/* Balance summary */}
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
                            {/* Amount */}
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
                                                    const val = e.target.value;
                                                    const formatNumber = (v: string) => {
                                                        if (!v) return "";
                                                        const rawMatch = v.replace(/,/g, '').match(/^-?\d*\.?\d*/);
                                                        if (!rawMatch) return v;
                                                        const parts = rawMatch[0].split(".");
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                        return parts.join(".");
                                                    };
                                                    field.onChange(formatNumber(val));
                                                }}
                                            />
                                            {activeCycle && balanceCents > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full mt-2 text-xs h-8"
                                                    onClick={() => {
                                                        const formatNumber = (v: string) => {
                                                            const parts = v.split(".");
                                                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                            return parts.join(".");
                                                        };
                                                        form.setValue("amount", formatNumber(balanceCents.toString()));
                                                    }}
                                                >
                                                    Pay Full Amount
                                                </Button>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Date */}
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

                        {/* Live remaining preview */}
                        {activeCycle && enteredAmount > 0 && (
                            <div className={`rounded-xl p-3 flex items-center justify-between text-sm font-medium ${isFullPayment ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`}>
                                <span>{isFullPayment ? "✓ Fully clears the balance" : "Partial payment — remaining balance:"}</span>
                                {!isFullPayment && <span className="font-bold">{formatCurrency(remaining)}</span>}
                            </div>
                        )}

                        {/* Note */}
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Mobile money ref, bank transfer ID…" rows={2} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
                            <Button type="submit" disabled={mutation.isPending || !selectedLoanId}>
                                {mutation.isPending ? "Saving…" : "Save Payment"}
                            </Button>
                        </div>
                    </form>
                </Form>
        </ResponsiveModal>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────
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

    const exportCSV = () => {
        if (!data?.data) return;
        const headers = ["Date", "Customer", "Loan ID", "Amount", "Notes"];
        const rows = data.data.map((p) => [
            formatDate(p.paidAt),
            `"${p.loan?.customer?.name || ""}"`,
            p.loanId,
            p.amount,
            `"${p.note || ''}"`,
        ].join(","));
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `payments_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-28 md:pb-6">
            <PageHeader
                title="Payments"
                description="All payments you've received."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportCSV} disabled={!data?.data?.length} className={isMobile ? "hidden" : ""}>
                            <HugeiconsIcon icon={Download04Icon} className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button variant="outline" size="icon" onClick={exportCSV} disabled={!data?.data?.length} className={isMobile ? "" : "hidden"} title="Export CSV">
                            <HugeiconsIcon icon={Download04Icon} className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setDialogOpen(true)} className="hidden md:flex">
                            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                            Collect Payment
                        </Button>
                    </div>
                }
            />

            <RecordPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />

            {/* Mobile: card list */}
            {isMobile ? (
                <div className="space-y-2">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-3 w-20 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-20 rounded-md" />
                            </div>
                        ))
                    ) : data?.data?.length === 0 ? (
                        <p className="py-12 text-center text-zinc-500">No payments recorded yet.</p>
                    ) : (
                        data?.data?.map((payment) => (
                            <PaymentCard key={payment.id} payment={payment} />
                        ))
                    )}
                </div>
            ) : (
                /* Desktop: table */
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
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-36 rounded-md" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 rounded-md inline-block" /></TableCell>
                                    </TableRow>
                                ))
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
                                            ) : <span className="font-medium">-</span>}
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
            )}

            {/* Mobile sticky record payment bar */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800">
                <Button className="w-full" onClick={() => setDialogOpen(true)}>
                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                    Collect Payment
                </Button>
            </div>
        </div>
    );
}
