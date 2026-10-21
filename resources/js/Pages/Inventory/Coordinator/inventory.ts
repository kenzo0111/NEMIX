export interface Stock { id: number; name: string; sku: string; unit: string; quantity: number; value: string; }
export interface Movement { id: number; type: string; quantity: number; date: string; reference: string; office: string; stock: Stock; }
export const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
export function displayDate(value: string) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function stockStatus(quantity: number, lowThreshold: number) {
    if (quantity <= 0) return { label: 'Out of stock', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
    if (quantity <= lowThreshold) return { label: 'Low stock', classes: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' };
    return { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
}
export const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
export const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
