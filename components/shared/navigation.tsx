"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserMultipleIcon,
  Wallet01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/shared/sidebar-context";

const allNavItems = [
  { title: "Dashboard", url: "/", icon: DashboardSquare01Icon },
  { title: "Borrowers", url: "/customers", icon: UserMultipleIcon },
  { title: "Loans", url: "/loans", icon: Wallet01Icon },
  { title: "Settings", url: "/settings", icon: Settings01Icon },
];

// Mobile bottom dock uses the same items.
const mobileNavItems = allNavItems;

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();

  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding")
  ) {
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
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-muted border-r border-border transition-all duration-200",
          collapsed ? "w-16" : "w-56",
        )}
      >
        {/* Logo + Sidebar trigger */}
        <div
          className={cn(
            "flex items-center h-16 shrink-0 gap-2",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg overflow-hidden min-w-0"
          >
            <Image
              src="/blessed.png"
              alt="Logo"
              width={28}
              height={28}
              className="shrink-0"
            />
            {!collapsed && <span className="truncate">Blessed</span>}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground shrink-0 h-8 w-8"
            >
              <HugeiconsIcon icon={SidebarLeft01Icon} className="w-5 h-5" />
            </Button>
          )}
        </div>
        {collapsed && (
          <div className="px-2 pb-2 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Expand sidebar"
              className="text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground h-8 w-8"
            >
              <HugeiconsIcon icon={SidebarLeft01Icon} className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-primary-foreground",
                )}
              >
                <HugeiconsIcon icon={item.icon} className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-border shrink-0">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full h-auto justify-start gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center",
            )}
          >
            <svg
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM DOCK ── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="mx-auto flex h-16 max-w-sm items-center justify-around rounded-full border border-border bg-card px-2 shadow-2xl shadow-foreground/10 pointer-events-auto">
          {mobileNavItems.map((item) => {
            const isActive =
              item.url === "/"
                ? pathname === "/"
                : pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                href={item.url}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full text-[10px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-muted-foreground",
                )}
              >
                <HugeiconsIcon icon={item.icon} className="w-5 h-5" />
                <span className="truncate leading-none">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
