import { StatusOption, SupplierStatus } from './types';

export const STATUS_OPTIONS: StatusOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active / Compliant' },
    { value: 'pending', label: 'Pending Renewal' },
    { value: 'blacklisted', label: 'Blacklisted' },
];

export const FORM_STATUS_OPTIONS: { value: SupplierStatus; label: string }[] = [
    { value: 'active', label: 'Active / Compliant' },
    { value: 'pending', label: 'Pending Renewal' },
    { value: 'blacklisted', label: 'Blacklisted' },
];

export const DEFAULT_CATEGORY = 'goods' as const;
export const CATEGORY_DISPLAY_LABEL = 'Consumable Office Supplies';

export const institutionalSelectStyles = {
    control: (provided: Record<string, unknown>, state: { isFocused: boolean; isDisabled?: boolean }) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '160px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '500',
        backgroundColor: state.isDisabled ? '#f9fafb' : '#ffffff',
        cursor: state.isDisabled ? 'not-allowed' : 'default',
        '&:hover': {
            borderColor: state.isDisabled ? '#d1d5db' : '#7f1d1d',
        },
    }),
    option: (
        provided: Record<string, unknown>,
        state: { isSelected: boolean; isFocused: boolean }
    ) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? '#7f1d1d'
            : state.isFocused
            ? '#fef2f2'
            : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '8px 12px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        cursor: 'pointer',
    }),
    singleValue: (provided: Record<string, unknown>) => ({
        ...provided,
        color: '#111827',
        fontSize: '0.8125rem',
        fontWeight: '500',
    }),
    placeholder: (provided: Record<string, unknown>) => ({
        ...provided,
        color: '#6b7280',
        fontSize: '0.8125rem',
        fontWeight: '400',
    }),
    menu: (provided: Record<string, unknown>) => ({
        ...provided,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        zIndex: 50,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};
