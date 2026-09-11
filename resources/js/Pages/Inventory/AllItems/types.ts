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

export interface ReceivingBatchRecord {
    id: number;
    supplier_id: number;
    supplier_name: string;
    quantity_received: number;
    quantity_remaining: number;
    unit_cost: number;
    batch_value: number;
    date_received: string;
}

export interface RecentIssuanceRecord {
    id: number;
    ris_number: string;
    date_issued: string;
    quantity: number;
    amount: number;
    recipient: string;
}

export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    stock_no?: string;
    supplier_id?: number | null;
    supplier?: Supplier | null;
    stock: number;
    on_hand?: number;
    unit_cost?: number | string;
    amount?: number | string;
    inventory_value?: number;
    status: InventoryStatus;
    description?: string | null;
    unit_of_issue?: string | null;
    unit?: string | null;
    rfid_tag?: string | null;
    receiving_batches?: ReceivingBatchRecord[];
    recent_issuances?: RecentIssuanceRecord[];
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
