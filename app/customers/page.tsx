"use client";

import { CustomerTable } from "@/features/customers/components/customer-table";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { useState } from "react";

export default function CustomersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState("");

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-sm text-muted-foreground mt-1 truncate">Your borrowers and what they&apos;re worth.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="icon"
                        aria-label="Search customers"
                        onClick={() => setIsSearchOpen(true)}
                        className="h-10 w-10 rounded-2xl border border-border bg-card"
                    >
                        <HugeiconsIcon icon={Search01Icon} className="w-5 h-5" />
                    </Button>
                    <Button
                        size="icon"
                        aria-label="Add customer"
                        onClick={() => setIsFormOpen(true)}
                        className="h-10 w-10 rounded-2xl shadow-lg shadow-primary/20"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <CustomerTable search={search} />

            {/* Search modal */}
            <ResponsiveModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                title="Search customers"
                description="Find by name, phone, or ID."
            >
                <div className="relative mt-1">
                    <HugeiconsIcon
                        icon={Search01Icon}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        autoFocus
                        placeholder="Search by name, phone, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setIsSearchOpen(false)}
                        className="pl-10 pr-10 h-12 rounded-2xl border-border bg-card focus-visible:ring-primary/20"
                    />
                    {search && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <Button
                    className="w-full h-12 rounded-2xl mt-4 font-semibold"
                    onClick={() => setIsSearchOpen(false)}
                >
                    Done
                </Button>
            </ResponsiveModal>

            <CustomerForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    );
}
