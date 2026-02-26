import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

export function StatCard({
    title,
    value,
    icon,
    description,
    trend,
    className
}: {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    description?: string;
    trend?: { value: number; label: string; positive: boolean };
    className?: string;
}) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {title}
                </CardTitle>
                {icon && <div className="text-zinc-400">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={trend.positive ? "text-emerald-500" : "text-red-500"}>
                                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                        {trend && <span className="text-zinc-300 mx-1">•</span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
