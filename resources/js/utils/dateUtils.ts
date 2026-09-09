/**
 * dateUtils.ts - System-Wide Robust Date Utility
 * 
 * Solves UTC offset, midnight shifts, and 1-day rollback bugs by ensuring:
 * 1. Calendar dates (YYYY-MM-DD) remain pure without UTC timezone conversions.
 * 2. Current "today" respects the user's local calendar day (never shifts back to yesterday).
 * 3. Consistent formatting across official forms, input controls, and tables.
 */

/**
 * Returns a normalized local calendar date string formatted as `YYYY-MM-DD`.
 * If input is null/undefined, returns today's local date (e.g. "2026-09-10").
 */
export const getLocalDateString = (input?: Date | string | number | null): string => {
    if (!input) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    if (input instanceof Date) {
        if (Number.isNaN(input.getTime())) return '';
        const y = input.getFullYear();
        const m = String(input.getMonth() + 1).padStart(2, '0');
        const d = String(input.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    if (typeof input === 'number') {
        const d = new Date(input);
        if (Number.isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    const trimmed = String(input).trim();
    if (!trimmed || trimmed === '-' || trimmed === 'N/A') return '';

    // 1. Direct YYYY-MM-DD match (preserves calendar date strictly)
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
        const y = ymdMatch[1];
        const m = ymdMatch[2].padStart(2, '0');
        const d = ymdMatch[3].padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 2. Direct MM/DD/YYYY or M/D/YYYY match
    const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdyMatch) {
        const m = mdyMatch[1].padStart(2, '0');
        const d = mdyMatch[2].padStart(2, '0');
        const y = mdyMatch[3];
        return `${y}-${m}-${d}`;
    }

    // 3. Fallback for timestamps with time info (e.g. ISO-8601 "2026-09-09T16:00:00.000Z")
    // When parsing ISO with timezone, convert to local Date and extract local year/month/day
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970 && parsed.getFullYear() <= 2100) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return '';
};

/**
 * Parses a date input into a local Date object set at local midnight.
 * Prevents UTC-midnight shifting.
 */
export const parseToLocalDate = (input?: string | Date | null): Date | null => {
    if (!input) return null;
    if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

    const ymd = getLocalDateString(input);
    if (!ymd) return null;

    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Formats any date input into a human-readable string without 1-day timezone regression.
 * - 'MM/DD/YYYY': e.g. "09/10/2026"
 * - 'YYYY-MM-DD': e.g. "2026-09-10"
 * - 'long': e.g. "September 10, 2026"
 * - 'short': e.g. "Sep 10, 2026"
 */
export const formatDisplayDate = (
    dateInput?: string | Date | null,
    format: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'long' | 'short' = 'MM/DD/YYYY'
): string => {
    if (!dateInput) return '';

    const cleanYmd = getLocalDateString(dateInput);
    if (!cleanYmd) return typeof dateInput === 'string' ? dateInput : '';

    const [yearStr, monthStr, dayStr] = cleanYmd.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (format === 'YYYY-MM-DD') {
        return cleanYmd;
    }

    if (format === 'MM/DD/YYYY') {
        return `${monthStr}/${dayStr}/${yearStr}`;
    }

    // Build local date object at noon to be completely safe against DST/offset edges
    const localDate = new Date(year, month - 1, day, 12, 0, 0);

    if (format === 'long') {
        return localDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }

    if (format === 'short') {
        return localDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    return `${monthStr}/${dayStr}/${yearStr}`;
};
