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
