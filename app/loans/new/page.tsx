"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LoanForm } from "@/components/loans/loan-form";
import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

export default function NewLoanPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white flex items-center mb-4 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <PageHeader
                title="Issue New Loan"
                description="Set up a new loan schedule and record initial collateral items."
            />

            <LoanForm />
        </div>
    );
}
