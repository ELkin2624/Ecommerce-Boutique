import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(num);
}

export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}
