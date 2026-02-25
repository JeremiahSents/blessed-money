import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number | bigint | string): string {
  const amountStr = cents.toString();
  // Simple parsed to number just for Intl format since it handles safe integers
  // Cent value divided by 100 for display
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amountStr) / 100);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
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
