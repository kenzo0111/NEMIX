import { StatusOption, SupplierStatus } from './types';
import { institutionalSelectStyles } from '@/styles/selectStyles';

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

export const supplierSelectStyles = institutionalSelectStyles;
export { institutionalSelectStyles };
