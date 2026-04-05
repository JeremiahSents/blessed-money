import { Navigation } from "@/components/shared/navigation";
import { MainContent } from "@/components/shared/main-content";
import { AdminGuard } from "@/components/shared/admin-guard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
        <Navigation />
        <MainContent>{children}</MainContent>
      </div>
    </AdminGuard>
  );
}
