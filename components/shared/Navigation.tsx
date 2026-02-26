"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpenIcon, LayoutDashboardIcon, UsersIcon, WalletIcon, FileTextIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();

    // Hide navigation on auth pages
    if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
        return null;
    }

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    const navItems = [
        { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon className="w-5 h-5" /> },
        { title: "Customers", url: "/customers", icon: <UsersIcon className="w-5 h-5" /> },
        { title: "Loans", url: "/loans/new", icon: <WalletIcon className="w-5 h-5" /> },
        { title: "Payments", url: "/payments", icon: <FileTextIcon className="w-5 h-5" /> },
        { title: "Reports", url: "/reports", icon: <BookOpenIcon className="w-5 h-5" /> },
    ];

    const currentTab = navItems.find((item) =>
        item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
    )?.url || "/";

    return (
        <>
            {/* HEADER SECTION (Desktop & Mobile) */}
            <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950">
                <div className="flex h-16 items-center px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl md:mr-6">
                        <BookOpenIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        <span className="hidden md:inline-block">LendTrack</span>
                    </Link>

                    {/* DESKTOP TABS */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <Tabs value={currentTab} className="w-full max-w-2xl" onValueChange={(value) => router.push(value)}>
                            <TabsList className="w-full grid grid-cols-5 h-11">
                                {navItems.map((item) => (
                                    <TabsTrigger key={item.url} value={item.url} className="text-sm data-[state=active]:bg-primary/5">
                                        {item.title}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* RIGHT SIDE: SETTINGS / PROFILE (Desktop only) */}
                    <div className="hidden md:flex items-center gap-4 ml-auto">
                        <Link href="/settings" className="text-zinc-500 hover:text-foreground">
                            <SettingsIcon className="w-5 h-5" />
                        </Link>
                        <button onClick={handleSignOut} className="text-sm text-red-500 hover:text-red-600 font-medium">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE BOTTOM DOCK */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-zinc-950 pb-safe">
                <div className="flex h-16 items-center justify-around px-2">
                    {navItems.map((item) => {
                        const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                    }`}
                            >
                                {item.icon}
                                <span className="text-[10px] font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
