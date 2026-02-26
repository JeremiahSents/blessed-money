"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from '@hugeicons/react';
import { Book02Icon, DashboardSquare01Icon, UserMultipleIcon, Wallet01Icon, PropertyEditIcon, Settings01Icon } from '@hugeicons/core-free-icons';
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    const navItems = [
        { title: "Dashboard", url: "/", icon: <HugeiconsIcon icon={DashboardSquare01Icon} className="w-5 h-5" /> },
        { title: "Customers", url: "/customers", icon: <HugeiconsIcon icon={UserMultipleIcon} className="w-5 h-5" /> },
        { title: "Loans", url: "/loans/new", icon: <HugeiconsIcon icon={Wallet01Icon} className="w-5 h-5" /> },
        { title: "Payments", url: "/payments", icon: <HugeiconsIcon icon={PropertyEditIcon} className="w-5 h-5" /> },
        { title: "Reports", url: "/reports", icon: <HugeiconsIcon icon={Book02Icon} className="w-5 h-5" /> },
    ];
    const currentTab = navItems.find((item) =>
        item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
    )?.url || "/";

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 pb-16 md:pb-0">
            <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950">
                <div className="flex h-16 items-center px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl md:mr-6">
                        <Image src="/blessed.png" alt="Logo" width={32} height={32} />
                        <span className="hidden md:inline-block">Blessed</span>
                    </Link>

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
                            <HugeiconsIcon icon={Settings01Icon} className="w-5 h-5" />
                        </Link>
                        <button onClick={handleSignOut} className="text-sm text-red-500 hover:text-red-600 font-medium">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
                {children}
            </main>

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
        </div>
    );
}
