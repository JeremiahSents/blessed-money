"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { CustomerCard } from "@/components/customers/customer-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import type { Customer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function CustomerTable() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isError } = useQuery<{ data: Customer[]; meta: { totalPages: number } }>({
        queryKey: ['customers', search, page],
        queryFn: async () => {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
        }
    });

    const Pagination = () => ((data?.meta?.totalPages ?? 0) > 1) ? (
        <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
            </Button>
            <div className="text-sm text-zinc-500">Page {page} of {data?.meta?.totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data?.meta?.totalPages ?? p, p + 1))} disabled={page === (data?.meta?.totalPages ?? page)}>
                Next
            </Button>
        </div>
    ) : null;

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <Input
                    placeholder="Search by name, phone, or ID..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 md:max-w-sm rounded-full md:rounded-md"
                />
            </div>

            {/* Mobile: card list */}
            {isMobile ? (
                <div className="space-y-2">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))
                    ) : isError ? (
                        <p className="text-center text-red-500 py-8">Failed to load customers.</p>
                    ) : data?.data?.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">No customers found.</p>
                    ) : (
                        data?.data?.map((customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))
                    )}
                    <Pagination />
                </div>
            ) : (
                /* Desktop: table */
                <>
                    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Active Loans</TableHead>
                                    <TableHead>Total Lent</TableHead>
                                    <TableHead>Balance Owed</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-red-500 py-8">Failed to load customers.</TableCell>
                                    </TableRow>
                                ) : data?.data?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-zinc-500 py-8">No customers found.</TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data?.map((customer) => (
                                        <TableRow key={customer.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={() => router.push(`/customers/${customer.id}`)}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>{customer.phone || "-"}</TableCell>
                                            <TableCell>
                                                {(customer.activeLoanCount ?? 0) > 0 ? (
                                                    <Badge variant="default">{customer.activeLoanCount}</Badge>
                                                ) : (
                                                    <span className="text-zinc-400 text-sm">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{formatCurrency(customer.totalLent ?? "0")}</TableCell>
                                            <TableCell className="text-sm">
                                                {Number(customer.outstandingBalance ?? 0) > 0 ? (
                                                    <span className="text-red-500 font-medium">{formatCurrency(customer.outstandingBalance ?? "0")}</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-medium">Cleared</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/customers/${customer.id}`); }}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination />
                </>
            )}
        </div>
    );
}
