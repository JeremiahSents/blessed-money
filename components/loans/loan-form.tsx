"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CollateralUploader, CollateralFormData } from "../collateral/collateral-uploader";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, UserIcon, PlusSignIcon, Coins01Icon, Calendar01Icon, MoneyBag01Icon, Shield01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from "next/navigation";
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxCollection,
    ComboboxEmpty,
} from "@/components/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format } from "date-fns";
import type { Customer } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { CustomerForm } from "@/components/customers/customer-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const loanSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    principalAmount: z.string().min(1, "Principal is required"),
    interestRate: z.string().min(1, "Interest rate is required"),
    startDate: z.date({ error: "Start date is required" }),
    dueDate: z.date({ error: "Due date is required" }),
    notes: z.string().min(1, "Notes are required"),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function LoanForm() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [collateralItems, setCollateralItems] = useState<CollateralFormData[]>([]);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");

    const searchParams = useSearchParams();
    const preselectedCustomer = searchParams.get("customer") || "";

    const { data: customersData } = useQuery<{ data: Customer[] }>({
        queryKey: ['customers', '', 1],
        queryFn: async () => {
            const res = await fetch(`/api/customers?limit=100`);
            return res.json();
        }
    });

    const formatWithCommas = (val: string) => {
        if (!val) return "";
        const parts = val.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const form = useForm<LoanFormValues>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            customerId: "",
            principalAmount: "",
            interestRate: "20",
            startDate: new Date(),
            dueDate: addMonths(new Date(), 1),
            notes: "",
        },
    });

    useEffect(() => {
        if (preselectedCustomer && customersData?.data) {
            const match = customersData.data.find(c => c.id === preselectedCustomer);
            if (match) form.setValue("customerId", match.id);
        }
    }, [customersData, preselectedCustomer, form]);

    const mutation = useMutation({
        mutationFn: async (values: LoanFormValues) => {
            const interestRateDecimal = (parseFloat(values.interestRate) / 100).toFixed(4);

            const res1 = await fetch(`/api/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    interestRate: interestRateDecimal,
                    startDate: values.startDate.toISOString().split('T')[0],
                    dueDate: values.dueDate.toISOString().split('T')[0],
                    collateralItems: []
                }),
            });

            if (!res1.ok) {
                const err = await res1.json();
                throw new Error(err.error || "Failed to create loan");
            }

            const loanData = await res1.json();
            const newLoanId = loanData.data.id;

            for (const item of collateralItems) {
                const cRes = await fetch(`/api/loans/${newLoanId}/collateral`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        description: item.description,
                        estimatedValue: item.estimatedValue,
                        serialNumber: item.serialNumber,
                        notes: item.notes,
                    })
                });
                const cData = await cRes.json();

                if (item.files.length > 0) {
                    const formData = new FormData();
                    item.files.forEach(f => formData.append("files", f));
                    await fetch(`/api/loans/${newLoanId}/collateral/${cData.data.id}/images`, {
                        method: "POST",
                        body: formData
                    });
                }
            }

            return newLoanId;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            toast.success("Loan successfully issued!");
            router.push(`/loans/${id}`);
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        }
    });

    const onSubmit = (values: LoanFormValues) => {
        mutation.mutate(values);
    };

    const handleAddCollateral = (data: CollateralFormData) => {
        setCollateralItems((prev) => [...prev, data]);
    };

    const removeCollateral = (index: number) => {
        setCollateralItems(collateralItems.filter((_, i) => i !== index));
    };

    const previewUrls = useMemo(
        () => collateralItems.map((item) => (item.files[0] ? URL.createObjectURL(item.files[0]) : null)),
        [collateralItems]
    );

    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const handleCustomerSuccess = (data: any) => {
        const newCustId = data?.data?.id || data?.id;
        if (newCustId) {
            form.setValue("customerId", newCustId);
            setCustomerSearch("");
            toast.success("Customer created and selected.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <CustomerForm
                open={isCustomerModalOpen}
                onOpenChange={setCustomerModalOpen}
                defaultValues={customerSearch ? { name: customerSearch } : undefined}
                onSuccess={handleCustomerSuccess}
            />

            <Form {...form}>
                <form id="loan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Card 1: Borrower Information */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-primary/10"></div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-primary">
                                <HugeiconsIcon icon={UserIcon} className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Borrower Information</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Select an existing customer or create a new one.</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => {
                                    const selectedCustomer = customersData?.data?.find(c => c.id === field.value) || null;
                                    return (
                                        <FormItem>
                                            <FormControl>
                                                <Combobox
                                                    items={customersData?.data || []}
                                                    itemToStringLabel={(c: Customer) => c.name}
                                                    itemToStringValue={(c: Customer) => c.id}
                                                    value={selectedCustomer}
                                                    onValueChange={(c: Customer | null) => {
                                                        field.onChange(c?.id || "");
                                                        if (c) setTimeout(() => form.setFocus("principalAmount"), 0);
                                                    }}
                                                    onInputValueChange={setCustomerSearch}
                                                >
                                                    <ComboboxInput
                                                        placeholder="Search by name..."
                                                        showTrigger={false}
                                                        className="h-14 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-5 text-base font-medium focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm"
                                                    >
                                                        <HugeiconsIcon
                                                            icon={Search01Icon}
                                                            className="size-5 text-zinc-400 shrink-0 pointer-events-none"
                                                        />
                                                    </ComboboxInput>
                                                    <ComboboxContent
                                                        sideOffset={8}
                                                        className="rounded-2xl p-2 shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl"
                                                    >
                                                        <ComboboxList className="max-h-[300px]">
                                                            <ComboboxCollection>
                                                                {(c: Customer) => (
                                                                    <ComboboxItem
                                                                        key={c.id}
                                                                        value={c}
                                                                        className="rounded-xl px-3 py-2.5 cursor-pointer data-highlighted:bg-primary/5 data-highlighted:text-primary"
                                                                    >
                                                                        <div className="flex items-center gap-3 w-full">
                                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                                <HugeiconsIcon icon={UserIcon} className="size-4" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                                <span className="font-semibold text-sm leading-tight text-zinc-900 dark:text-zinc-100 truncate">
                                                                                    {c.name}
                                                                                </span>
                                                                                {c.phone && (
                                                                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                                                                                        {c.phone}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </ComboboxItem>
                                                                )}
                                                            </ComboboxCollection>
                                                            <ComboboxEmpty className="flex-col p-3 gap-2 text-left items-stretch">
                                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 px-2">
                                                                    No customer found{customerSearch ? ` for "${customerSearch}"` : ""}.
                                                                </p>
                                                                <Button
                                                                    type="button"
                                                                    className="w-full justify-start h-12 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20"
                                                                    onClick={() => setCustomerModalOpen(true)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 shrink-0">
                                                                            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                                                                        </div>
                                                                        <span className="font-semibold text-sm">
                                                                            {customerSearch ? `Create "${customerSearch}"` : "Add New Customer"}
                                                                        </span>
                                                                    </div>
                                                                </Button>
                                                            </ComboboxEmpty>
                                                        </ComboboxList>
                                                    </ComboboxContent>
                                                </Combobox>
                                            </FormControl>
                                            <FormMessage className="ml-1 mt-2" />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* Card 2: Loan Configuration */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-primary/10"></div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-primary">
                                <HugeiconsIcon icon={MoneyBag01Icon} className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Loan Structure</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Define the core terms of the loan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <FormField
                                control={form.control}
                                name="principalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Principal Amount (UGX) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-zinc-500 sm:text-sm font-medium">UGX</span>
                                                </div>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="50,000"
                                                    className="pl-12 h-14 text-base font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    value={formatWithCommas(field.value)}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/,/g, "");
                                                        // Allow only digits and a single decimal point
                                                        if (/^\d*\.?\d*$/.test(rawValue)) {
                                                            field.onChange(rawValue);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Interest Rate / Month <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="20"
                                                    className="pr-10 h-14 text-base font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    {...field}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-zinc-500 sm:text-sm font-semibold">%</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-zinc-400" />
                                            Start Date <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Popover>
                                                <PopoverTrigger
                                                    render={(props) => (
                                                        <Button
                                                            {...props}
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full h-14 pl-4 text-left text-base font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <HugeiconsIcon icon={Calendar01Icon} className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    )}
                                                />
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(date) => {
                                                            field.onChange(date);
                                                            if (date) {
                                                                form.setValue("dueDate", addMonths(date, 1));
                                                            }
                                                        }}
                                                        disabled={(date) =>
                                                            date < new Date("1900-01-01")
                                                        }
                                                        captionLayout="dropdown"
                                                        fromYear={2024}
                                                        toYear={2045}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-zinc-400" />
                                            First Payment Due <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Popover>
                                                <PopoverTrigger
                                                    render={(props) => (
                                                        <Button
                                                            {...props}
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full h-14 pl-4 text-left text-base font-medium rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <HugeiconsIcon icon={Calendar01Icon} className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    )}
                                                />
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < (form.getValues("startDate") || new Date())
                                                        }
                                                        captionLayout="dropdown"
                                                        fromYear={2024}
                                                        toYear={2045}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Additional Notes <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Specify loan purpose, agreements, or special conditions..."
                                                    className="resize-none min-h-[100px] rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Security & Collateral */}
                    <div className="bg-white dark:bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-primary/10"></div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-primary">
                                <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Collateral</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Snap or upload images of items secured against this loan.</p>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <CollateralUploader onAdd={handleAddCollateral} />

                            {collateralItems.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {collateralItems.map((item, idx) => {
                                        const previewUrl = previewUrls[idx];
                                        return (
                                            <div
                                                key={idx}
                                                className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 group"
                                            >
                                                {previewUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={previewUrl}
                                                        alt={item.description}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <HugeiconsIcon icon={Shield01Icon} className="w-8 h-8 text-zinc-300" />
                                                    </div>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-full shadow-md"
                                                    onClick={() => removeCollateral(idx)}
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xl shadow-primary/10 dark:shadow-white/10 transition-all active:scale-[0.98]"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                                    Processing Loan...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Coins01Icon} className="w-5 h-5" />
                                    Confirm & Give Loan
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
