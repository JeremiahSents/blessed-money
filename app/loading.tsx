import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-0 px-2 pt-2">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
            </div>

            {/* Stats Grid Skeleton - 2x2 on mobile, 4-column on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {[...Array(4)].map((_, i) => (
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

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-4 gap-2 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-2">
                        <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-2xl" />
                        <Skeleton className="h-2 w-12 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Activity Feed Skeleton */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                {[...Array(5)].map((_, i) => (
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
