"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { CustomerCard } from "@/features/customers/components/customer-card";
import type { Customer } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function CustomerTable() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;
    const deferredSearch = useDeferredValue(search);

    const { data, isLoading, isError } = useQuery<{ data: Customer[]; meta: { totalPages: number } }>({
        queryKey: ["customers", deferredSearch, page],
        queryFn: async () => {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(deferredSearch)}&page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
        },
    });

    const totalPages = data?.meta?.totalPages ?? 0;
    const showPagination = totalPages > 1;
    const pagination = showPagination ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
                {data?.data?.length ?? 0} result{(data?.data?.length ?? 0) === 1 ? "" : "s"}
                {deferredSearch ? (
                    <span className="text-muted-foreground"> for {deferredSearch}</span>
                ) : null}
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 rounded-full px-4"
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground tabular-nums">
                    Page {page} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-9 rounded-full px-4"
                >
                    Next
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <div className="space-y-4 md:space-y-5">
            <div className="relative">
                <HugeiconsIcon
                    icon={Search01Icon}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                />
                <Input
                    placeholder="Search by name, phone, or ID..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="pl-10 h-12 md:h-11 rounded-2xl md:rounded-full md:max-w-lg border-border bg-card shadow-sm dark:shadow-none focus-visible:ring-primary/20"
                />
            </div>

            {isMobile ? (
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm dark:shadow-none"
                            >
                                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32 rounded-full" />
                                    <Skeleton className="h-3 w-24 rounded-full" />
                                </div>
                                <div className="space-y-2 text-right">
                                    <Skeleton className="h-3 w-16 rounded-full ml-auto" />
                                    <Skeleton className="h-4 w-8 rounded-full ml-auto" />
                                </div>
                            </div>
                        ))
                    ) : isError ? (
                        <p className="text-center text-destructive py-8">Failed to load customers.</p>
                    ) : data?.data?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No customers found.</p>
                    ) : (
                        data?.data?.map((customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))
                    )}
                    {pagination}
                </div>
            ) : (
                <div className="rounded-[28px] border border-border bg-card shadow-sm dark:shadow-none overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted dark:hover:bg-muted">
                                <TableHead className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Name</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phone</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active Loans</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Lent</TableHead>
                                <TableHead className="px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Balance Owed</TableHead>
                                <TableHead className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-border">
                                        <TableCell className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 rounded-full" />
                                                    <Skeleton className="h-3 w-20 rounded-full" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                                        <TableCell className="px-4 py-4"><Skeleton className="h-6 w-10 rounded-full" /></TableCell>
                                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-28 rounded-full" /></TableCell>
                                        <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                                        <TableCell className="px-4 py-4 text-right"><Skeleton className="h-8 w-16 rounded-full inline-block" /></TableCell>
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-destructive py-12">Failed to load customers.</TableCell>
                                </TableRow>
                            ) : data?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">No customers found.</TableCell>
                                </TableRow>
                            ) : (
                                data?.data?.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        className="cursor-pointer border-border hover:bg-muted dark:hover:bg-muted transition-colors"
                                        onClick={() => router.push(`/customers/${customer.id}`)}
                                    >
                                        <TableCell className="px-4 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <PersonAvatar seed={customer.id} name={customer.name} className="w-10 h-10 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{customer.name}</p>
                                                    {!customer.isActive && (
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inactive</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 text-muted-foreground">{customer.phone || "-"}</TableCell>
                                        <TableCell className="px-4 py-4">
                                            {(customer.activeLoanCount ?? 0) > 0 ? (
                                                <Badge className="h-6 rounded-full px-2.5 text-[11px] font-semibold border-none bg-primary/10 text-primary">
                                                    {customer.activeLoanCount}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm font-medium">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-4 text-sm font-medium text-foreground tabular-nums">
                                            {formatCurrency(customer.totalLent ?? "0")}
                                        </TableCell>
                                        <TableCell className="px-4 py-4 text-sm">
                                            {Number(customer.outstandingBalance ?? 0) > 0 ? (
                                                <span className="font-semibold text-destructive tabular-nums">
                                                    {formatCurrency(customer.outstandingBalance ?? "0")}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                                    Cleared
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/customers/${customer.id}`);
                                                }}
                                                className="h-8 rounded-full px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="p-4 border-t border-border">
                        {pagination}
                    </div>
                </div>
            )}
        </div>
    );
}
