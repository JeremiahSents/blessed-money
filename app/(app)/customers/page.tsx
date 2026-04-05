"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { useState } from "react";

export default function CustomersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader
                title="Customers"
                description="Manage your client base and view their profiles."
                action={
                    <Button onClick={() => setIsFormOpen(true)}>
                        <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                        Add Customer
                    </Button>
                }
            />

            <CustomerTable />

            <CustomerForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    );
}
