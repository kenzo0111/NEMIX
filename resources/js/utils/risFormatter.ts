export const formatRisNumber = (value?: string | null): string => {
    if (!value) return '-';

    return value.replace(/^RIS-/i, '');
};

// Preserve calendar dates, but convert instants before choosing the Philippine day.
export const getRisCalendarDate = (value?: string | null, today = new Date()): string => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const instant = value ? new Date(value) : today;
    if (Number.isNaN(instant.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(instant);
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
};
