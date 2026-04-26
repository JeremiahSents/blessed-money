"use client";

import { useSidebar } from "@/components/shared/sidebar-context";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();
    return (
        <main
            className={cn(
                "pb-16 md:pb-0 transition-all duration-200",
                collapsed ? "md:pl-16" : "md:pl-56"
            )}
        >
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                {children}
            </div>
        </main>
    );
}
