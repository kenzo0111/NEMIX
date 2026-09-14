export const formatRisNumber = (value?: string | null): string => {
    if (!value) return '-';

    return value.replace(/^RIS-/i, '');
};
