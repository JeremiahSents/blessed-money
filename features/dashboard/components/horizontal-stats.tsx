import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface StatItem {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: { value: number; label: string; positive: boolean };
}

export function HorizontalStats({
  stats,
  className,
}: {
  stats: StatItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 px-2", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-all duration-200 min-w-0">
          <CardContent className="p-3 md:p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-600">
                {stat.title}
              </span>
              {stat.icon && (
                <div className="text-zinc-300 dark:text-zinc-800 group-hover:text-primary/40 transition-colors">
                  {stat.icon}
                </div>
              )}
            </div>
            <div>
              <div className="text-base md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-0.5 truncate">
                {stat.value}
              </div>
              {stat.description && (
                <p className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                  {stat.description}
                </p>
              )}
              {stat.trend && (
                <div className={cn(
                  "mt-1.5 text-[9px] font-semibold flex items-center gap-1",
                  stat.trend.positive ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500"
                )}>
                  {stat.trend.positive ? "↑" : "↓"} {Math.abs(stat.trend.value)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
