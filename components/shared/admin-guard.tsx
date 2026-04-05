"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    
    const { data: adminData, isLoading } = useQuery({
        queryKey: ["admin-me"],
        queryFn: async () => {
            const res = await fetch("/api/admin/me");
            if (!res.ok) return { isAdmin: false };
            return res.json();
        },
    });

    useEffect(() => {
        if (!isLoading && adminData && !adminData.isAdmin) {
            router.push("/access-denied");
        }
    }, [isLoading, adminData, router]);

    // Show loading state while checking
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show nothing if not admin (will redirect)
    if (!adminData?.isAdmin) {
        return null;
    }

    // Show content if admin
    return <>{children}</>;
}
