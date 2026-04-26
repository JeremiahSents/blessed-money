import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | bigint | string): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount.toString()));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export const friendlyStatus: Record<string, string> = {
  active: "Running",
  overdue: "Late",
  settled: "Cleared",
  open: "Waiting",
  closed: "Paid",
};
export const displayStatus = (s: string) => friendlyStatus[s] ?? s;

export function formatCompactCurrency(amount: number): string {
  if (amount === 0) return "UGX 0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}UGX ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    return `${sign}UGX ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `${sign}UGX ${abs.toLocaleString()}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  return name.split(/\s+/).map((part) => part.charAt(0)).slice(0, 2).join("").toUpperCase();
}

export function parseCurrency(displayAmount: string): bigint {
  // strip non-numeric except dot
  const cleanStr = displayAmount.replace(/[^0-9.]/g, '');
  if (!cleanStr) return 0n;
  const parts = cleanStr.split('.');

  if (parts.length === 1) {
    return BigInt(parts[0]) * 100n;
  }

  const whole = parts[0];
  let frac = parts[1];
  if (frac.length === 1) frac += '0';
  else if (frac.length > 2) frac = frac.substring(0, 2);

  return BigInt(whole + frac);
}
