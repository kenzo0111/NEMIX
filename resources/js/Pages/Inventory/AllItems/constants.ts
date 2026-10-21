import { SelectOption, InventoryStatus } from './types';

export const STATUS_OPTIONS: SelectOption<InventoryStatus>[] = [
    { value: 'Available', label: 'Available' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Critical Stock', label: 'Critical Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
];

export const customSelectStyles = {
    control: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : 'var(--border-color, #d1d5db)',
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '150px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: 'var(--surface-card, #ffffff)',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? 'rgba(153, 27, 27, 0.2)' : 'var(--surface-card, #ffffff)',
        color: state.isSelected ? '#ffffff' : 'var(--text-primary, #111827)',
        padding: '7px 12px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
    }),
    singleValue: (provided: Record<string, unknown>) => ({
        ...provided,
        color: 'var(--text-primary, #111827)',
        fontSize: '0.875rem',
        fontWeight: '500',
    }),
    input: (provided: Record<string, unknown>) => ({
        ...provided,
        color: 'var(--text-primary, #111827)',
    }),
    placeholder: (provided: Record<string, unknown>) => ({
        ...provided,
        color: 'var(--text-secondary, #9ca3af)',
        fontSize: '0.875rem',
        fontWeight: '400',
    }),
    menu: (provided: Record<string, unknown>) => ({
        ...provided,
        backgroundColor: 'var(--surface-card, #ffffff)',
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color, #e5e7eb)',
        zIndex: 50,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};
