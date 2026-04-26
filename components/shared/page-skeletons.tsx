import { Skeleton } from "@/components/ui/skeleton";

export function AppShellSkeleton() {
  return (
    <div className="min-h-svh bg-zinc-50/60 dark:bg-zinc-950 md:pl-56">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col border-r border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="flex-1 space-y-2 px-3 py-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                i === 2 ? "bg-primary/10" : ""
              }`}
            >
              <Skeleton className="h-5 w-5 rounded-md shrink-0" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200/70 dark:border-zinc-800 p-3">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </aside>

      <main className="pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6 lg:px-8 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-8 w-52 rounded-lg" />
            </div>
            <Skeleton className="hidden md:block h-10 w-10 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-full opacity-70" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[28px] border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 md:p-6 space-y-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
                    <div className="space-y-2 min-w-0">
                      <Skeleton className="h-4 w-36 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-16 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-0 px-2 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-36 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      {/* Hero stat card */}
      <div className="rounded-2xl border bg-card p-5 space-y-2">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-3 w-36 rounded-full opacity-60" />
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* Needs attention */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <div className="rounded-2xl border bg-card divide-y divide-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <div className="rounded-2xl border bg-card divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-44 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24 md:pb-12 px-4 sm:px-6">
      <div className="pt-8 space-y-8">
        <Skeleton className="h-4 w-28 rounded-full" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-56 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-40 rounded-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function LoansPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 pt-8 px-4 sm:px-6">
      <div className="flex flex-col gap-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-72 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[32px] border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
              </div>

              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TablePageSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: cols }).map((__, col) => (
                <Skeleton key={col} className="h-4 w-full rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
