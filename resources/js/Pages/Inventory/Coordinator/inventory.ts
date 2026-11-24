import { formatMoney, formatScreenDate } from '@/utils/displayFormat';
export interface Stock { id: number; name: string; sku: string; unit: string; quantity: number; value: string; }
export interface Movement { id: number; type: string; quantity: number; date: string; reference: string; office: string; stock: Stock; }
export const money = formatMoney;
export const displayDate = formatScreenDate;
export function stockStatus(quantity: number, lowThreshold: number) {
    if (quantity <= 0) return { label: 'Out of stock', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
    if (quantity <= lowThreshold) return { label: 'Low stock', classes: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' };
    return { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
}
export const panel = 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
export const secondaryButton = 'ui-button';
