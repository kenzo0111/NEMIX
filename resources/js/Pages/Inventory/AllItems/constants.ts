import { SelectOption, InventoryStatus } from './types';

export const UNIT_OF_ISSUE_OPTIONS: SelectOption<string>[] = [
    { value: 'piece', label: 'piece' },
    { value: 'box', label: 'box' },
    { value: 'pack', label: 'pack' },
    { value: 'ream', label: 'ream' },
    { value: 'sheet', label: 'sheet' },
    { value: 'roll', label: 'roll' },
    { value: 'set', label: 'set' },
    { value: 'carton', label: 'carton' },
    { value: 'bottle', label: 'bottle' },
    { value: 'tube', label: 'tube' },
    { value: 'unit', label: 'unit' },
    { value: 'bundle', label: 'bundle' },
    { value: 'crate', label: 'crate' },
    { value: 'packets', label: 'packets' },
];

export const STATUS_OPTIONS: SelectOption<InventoryStatus>[] = [
    { value: 'Available', label: 'Available' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
];

export const customSelectStyles = {
    control: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '150px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '500',
        backgroundColor: '#ffffff',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '7px 12px',
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
        color: '#9ca3af',
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
