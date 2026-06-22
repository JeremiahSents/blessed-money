"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/shared/navigation";
import { MainContent } from "@/components/shared/main-content";
import { AdminGuard } from "@/components/shared/admin-guard";

// Pages that render bare (no nav, no admin guard) — just centered content.
const BARE_ROUTES = ["/signin", "/access-denied"];

/**
 * Decides the layout for a page based on its route:
 * - sign-in / access-denied  → bare, centered (no sidebar, no admin check)
 * - everything else          → admin-guarded app shell with navigation
 *
 * This replaces the old (auth) / (app) route groups with a single shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isBare = BARE_ROUTES.some((r) => pathname.startsWith(r));

    if (isBare) {
        return (
            <div className="flex h-screen overflow-hidden items-center justify-center bg-muted px-4">
                {children}
            </div>
        );
    }

    return (
        <AdminGuard>
            <div className="min-h-screen bg-muted">
                <Navigation />
                <MainContent>{children}</MainContent>
            </div>
        </AdminGuard>
    );
}
