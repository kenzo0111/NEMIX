import { SelectOption, InventoryStatus } from './types';
import { institutionalSelectStyles } from '@/styles/selectStyles';

export const STATUS_OPTIONS: SelectOption<InventoryStatus>[] = [
    { value: 'Available', label: 'Available' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Critical Stock', label: 'Critical Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
];

export const customSelectStyles = institutionalSelectStyles;
