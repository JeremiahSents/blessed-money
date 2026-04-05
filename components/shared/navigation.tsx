"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Book02Icon,
    DashboardSquare01Icon,
    UserMultipleIcon,
    Wallet01Icon,
    PropertyEditIcon,
    Settings01Icon,
    SidebarLeft01Icon,
} from '@hugeicons/core-free-icons';
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/shared/sidebar-context";

const allNavItems = [
    { title: "Dashboard", url: "/", icon: DashboardSquare01Icon },
    { title: "Customers", url: "/customers", icon: UserMultipleIcon },
    { title: "Loans", url: "/loans", icon: Wallet01Icon },
    { title: "Payments", url: "/payments", icon: PropertyEditIcon },
    { title: "Reports", url: "/reports", icon: Book02Icon },
    { title: "Settings", url: "/settings", icon: Settings01Icon },
];

// Mobile bottom dock: 5 items (no Reports)
const mobileNavItems = allNavItems.filter(item => item.title !== "Reports");

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { collapsed, toggle } = useSidebar();

    if (pathname.startsWith("/signin") || pathname.startsWith("/signup") || pathname.startsWith("/onboarding")) {
        return null;
    }

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    return (
        <>
            {/* ── DESKTOP SIDEBAR ── */}
            <aside
                className={cn(
                    "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200",
                    collapsed ? "w-16" : "w-56"
                )}
            >
                {/* Logo */}
                <div className="flex items-center h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-lg overflow-hidden">
                        <Image src="/blessed.png" alt="Logo" width={28} height={28} className="shrink-0" />
                        {!collapsed && <span className="truncate">Blessed</span>}
                    </Link>
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
                    {allNavItems.map((item) => {
                        const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <HugeiconsIcon icon={item.icon} className="w-5 h-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                    <button
                        onClick={handleSignOut}
                        className={cn(
                            "w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors",
                            collapsed && "justify-center"
                        )}
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* ── DESKTOP TOP BAR (sidebar trigger lives here, outside sidebar) ── */}
            <header className="hidden md:flex fixed top-0 z-30 items-center h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-200"
                style={{ left: collapsed ? "4rem" : "14rem", right: 0 }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggle}
                    className="ml-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label="Toggle sidebar"
                >
                    <HugeiconsIcon icon={SidebarLeft01Icon} className="w-5 h-5" />
                </Button>
            </header>

            {/* ── MOBILE BOTTOM DOCK ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-zinc-950 pb-safe">
                <div className="flex h-16 items-center justify-around px-2">
                    {mobileNavItems.map((item) => {
                        const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
                                    isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                )}
                            >
                                <HugeiconsIcon icon={item.icon} className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.title}</span>
                                {isActive && <span className="absolute top-1 w-4 h-0.5 rounded-full bg-primary" />}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
