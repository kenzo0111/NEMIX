import { ReportPeriodType, ReportType } from './types';

export const REPORT_TYPE_OPTIONS: Array<{ value: ReportType; label: string; shortLabel: string; description: string }> = [
    {
        value: 'RSMI',
        label: 'RSMI — Report of Supplies and Materials Issued',
        shortLabel: 'RSMI',
        description: 'Official summary of inventory items issued based on approved Requisition and Issue Slips (RIS).',
    },
    {
        value: 'RPCI',
        label: 'RPCI — Report on the Physical Count of Inventories',
        shortLabel: 'RPCI',
        description: 'Periodic physical inventory count showing ledger balances, on-hand counts, and variances.',
    },
    {
        value: 'STOCK_CARD',
        label: 'Stock Card',
        shortLabel: 'Stock Card',
        description: 'Chronological stock ledger detailing receipts, issuances, and computed running balances per item.',
    },
    {
        value: 'MR',
        label: 'Memorandum Receipt',
        shortLabel: 'Memorandum Receipt',
        description: 'Official acknowledgement receipt for property and equipment issued to accountable officers.',
    },
];

export const PERIOD_OPTIONS: Array<{ value: ReportPeriodType; label: string }> = [
    { value: 'all', label: 'All Records / Full Ledger' },
    { value: 'specific', label: 'Specific Date' },
    { value: 'range', label: 'Date Range' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

export const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

export const getReportTypeLabel = (type?: string | null): string => {
    if (!type) return 'General Compliance Document';
    const found = REPORT_TYPE_OPTIONS.find(opt => opt.value === type);
    return found ? found.label : type;
};

export const getReportTypeShortLabel = (type?: string | null): string => {
    if (!type) return 'Document';
    const found = REPORT_TYPE_OPTIONS.find(opt => opt.value === type);
    return found ? found.shortLabel : type;
};

export const formatFundClusterDisplay = (val?: string | null): string => {
    if (!val || val === 'General Fund' || val === 'Regular Agency Fund' || val === '01') {
        return '01 - Regular Agency Fund';
    }
    return val;
};

export { institutionalSelectStyles as customSelectStyles } from '@/styles/selectStyles';
