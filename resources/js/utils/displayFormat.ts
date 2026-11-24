import { formatDisplayDate } from './dateUtils';

export const formatScreenDate = (value?: string | Date | null) => formatDisplayDate(value, 'short') || '—';

/** Operational timestamps use the institution's timezone and display its offset. */
export function formatTimestamp(value?: string | Date | null, timeZone = 'Asia/Manila'): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone, timeZoneName: 'short',
    }).format(date);
}

function numeric(value?: number | string | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
export function formatQuantity(value?: number | string | null): string {
    const parsed = numeric(value);
    return parsed === null ? '—' : new Intl.NumberFormat('en-PH', { maximumFractionDigits: 6 }).format(parsed);
}
export function formatMoney(value?: number | string | null): string {
    const parsed = numeric(value);
    return parsed === null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed);
}
