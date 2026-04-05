import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-0 px-2 pt-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-2.5 w-16 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-md" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-2 w-20 rounded-full opacity-60" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8 px-2 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-4 md:p-5 space-y-4 mx-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-44 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-2 w-10 rounded-full" />
              </div>
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 px-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start py-3 px-2 border-b border-zinc-100 dark:border-zinc-800/60 opacity-60">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-2 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
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
