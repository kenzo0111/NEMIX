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

export const customSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isDisabled ? '#e5e7eb' : (state.isFocused ? '#7f1d1d' : '#d1d5db'),
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '150px',
        boxShadow: state.isFocused && !state.isDisabled ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '500',
        backgroundColor: state.isDisabled ? '#f3f4f6' : '#ffffff',
        color: state.isDisabled ? '#4b5563' : '#111827',
        cursor: state.isDisabled ? 'not-allowed' : 'default',
        opacity: state.isDisabled ? 0.9 : 1,
        '&:hover': { borderColor: state.isDisabled ? '#e5e7eb' : '#7f1d1d' },
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '7px 12px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        cursor: 'pointer',
    }),
    singleValue: (provided: any, state: any) => ({
        ...provided,
        color: state.isDisabled ? '#374151' : '#111827',
        fontWeight: '500',
    }),
    menu: (provided: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        zIndex: 50,
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    indicatorSeparator: () => ({ display: 'none' }),
};
