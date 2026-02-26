"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboardIcon, UsersIcon, WalletIcon, ActivityIcon, FileTextIcon, SettingsIcon, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    const navItems = [
        { title: "Dashboard", url: "/dashboard", icon: "📊" },
        { title: "Customers", url: "/customers", icon: "👥" },
        { title: "Loans", url: "/loans/new", icon: "💰" }, // Or loan list, but specs only specified /loans/new and /loans/[id], usually there's no general loans list, but we can link to customers
        { title: "Payments", url: "/payments", icon: "💳" },
        { title: "Reports", url: "/reports", icon: "📈" },
    ];

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="h-16 flex justify-center px-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <BookOpenIcon className="w-5 h-5 text-primary" />
                        <span>LendTrack</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <Link href={item.url} className="w-full">
                                            <SidebarMenuButton isActive={pathname.startsWith(item.url)}>
                                                <span className="mr-2">{item.icon}</span>
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup className="mt-auto">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <Link href="/settings" className="w-full">
                                        <SidebarMenuButton>
                                            <span className="mr-2">⚙️</span>
                                            <span>Settings</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={handleSignOut} className="text-red-500">
                                        <span className="mr-2">🚪</span>
                                        <span>Sign Out</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
            </Sidebar>
            <div className="flex-1 flex flex-col min-h-screen">
                <header className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <SidebarTrigger />
                </header>
                <main className="flex-1 overflow-auto p-6 bg-zinc-50/50 dark:bg-zinc-950">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
