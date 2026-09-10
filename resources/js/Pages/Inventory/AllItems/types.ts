import { User, PageProps as BasePageProps, FlashMessages as BaseFlashMessages } from '@/types';

export interface Supplier {
    id: number;
    name: string;
    tin?: string | null;
    address?: string | null;
    reg_number?: string | null;
    category?: string | null;
    status?: string | null;
}

export type InventoryStatus = 'Available' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    supplier_id: number | null;
    supplier?: Supplier | null;
    stock: number;
    unit_cost: number | string;
    amount: number | string;
    status: InventoryStatus;
    description?: string | null;
    unit_of_issue?: string | null;
    rfid_tag?: string | null;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface FilterState {
    search: string;
    supplier: string | number | null;
    status: InventoryStatus | '' | null;
}

export interface SelectOption<T = string | number> {
    value: T;
    label: string;
}

export interface NotificationState {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
}

export type AuthUser = User;

export interface AuthProps {
    user: AuthUser;
    permissions?: string[];
    is_system_admin?: boolean;
}

export type FlashMessages = BaseFlashMessages;

export type AllItemsPageProps = BasePageProps<{
    items: InventoryItem[];
    suppliers?: Supplier[];
    pagination?: PaginationMeta;
    filters?: FilterState;
    lowStockThreshold?: number;
}>;

export type AllItemsProps = AllItemsPageProps;
