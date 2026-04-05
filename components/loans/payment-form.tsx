"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyReceive01Icon, Coins01Icon, Calendar04Icon, Note01Icon } from "@hugeicons/core-free-icons";

const paymentSchema = z.object({
    amount: z.string().min(1, "Amount is required"),
    paidAt: z.string().min(1, "Date is required"),
    note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentForm({
    loanId,
    open,
    onOpenChange,
    balance
}: {
    loanId: string,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    balance?: number
}) {
    const queryClient = useQueryClient();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: "",
            paidAt: new Date().toISOString().split('T')[0],
            note: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: PaymentFormValues) => {
            const res = await fetch(`/api/loans/${loanId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to record payment");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success("Payment recorded successfully");
            onOpenChange(false);
            form.reset();
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        }
    });

    const onSubmit = (values: PaymentFormValues) => {
        mutation.mutate({
            ...values,
            amount: values.amount.replace(/,/g, '')
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[32px] sm:rounded-[32px]">
                <div className="bg-primary/5 dark:bg-primary/10 px-6 py-8 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <HugeiconsIcon icon={MoneyReceive01Icon} className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-semibold tracking-tight">Record Payment</DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                            Log a new payment towards this loan. Make sure to verify the amount before saving.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    {balance !== undefined && balance > 0 && (
                        <div className="mb-8 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-zinc-400 mb-0.5 tracking-wider">Outstanding Balance</p>
                                <p className="text-lg font-semibold text-primary tabular-nums tracking-tight">{formatCurrency(balance)}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-semibold uppercase text-primary hover:bg-primary/10 rounded-lg px-3 transition-all"
                                onClick={() => {
                                    const formatNumber = (v: string) => {
                                        const parts = v.split(".");
                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                        return parts.join(".");
                                    };
                                    form.setValue("amount", formatNumber(balance.toString()));
                                }}
                            >
                                Pay Full
                            </Button>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2.5">
                                            <div className="flex items-center gap-2 px-1">
                                                <HugeiconsIcon icon={Coins01Icon} className="w-3.5 h-3.5 text-zinc-400" />
                                                <FormLabel className="text-xs font-semibold uppercase text-zinc-500 tracking-wide">Amount (UGX)</FormLabel>
                                            </div>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input
                                                        type="text"
                                                        placeholder="0.00"
                                                        className="h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl text-lg font-semibold focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
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
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px] font-semibold" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="paidAt"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2.5">
                                            <div className="flex items-center gap-2 px-1">
                                                <HugeiconsIcon icon={Calendar04Icon} className="w-3.5 h-3.5 text-zinc-400" />
                                                <FormLabel className="text-xs font-semibold uppercase text-zinc-500 tracking-wide">Date Collected</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Input 
                                                    type="date" 
                                                    className="h-12 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:ring-4 focus:ring-primary/10 transition-all"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px] font-semibold" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2.5">
                                            <div className="flex items-center gap-2 px-1">
                                                <HugeiconsIcon icon={Note01Icon} className="w-3.5 h-3.5 text-zinc-400" />
                                                <FormLabel className="text-xs font-semibold uppercase text-zinc-500 tracking-wide">Reference / Note</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Enter transaction ID or note..." 
                                                    className="min-h-[100px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px] font-semibold" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1 h-12 rounded-xl font-semibold uppercase text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-800 transition-all"
                                    onClick={() => onOpenChange(false)} 
                                    disabled={mutation.isPending}
                                >
                                    Discard
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 h-12 rounded-xl font-semibold uppercase text-xs bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Recording..." : "Save Payment"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
