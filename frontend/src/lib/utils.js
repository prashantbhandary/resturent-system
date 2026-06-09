import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Currency symbol is tenant-configurable (set once from /api/config at startup).
let currencySymbol = 'Rs';

export function setCurrencySymbol(symbol) {
  if (symbol) currencySymbol = symbol;
}

export function formatCurrency(amount) {
  return `${currencySymbol}${Number(amount || 0).toFixed(2)}`;
}

export function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}

export function orderAgeMinutes(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}
