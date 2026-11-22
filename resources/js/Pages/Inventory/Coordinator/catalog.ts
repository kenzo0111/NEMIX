export interface UserPreOrder {
    id: number;
    quantity: number;
    urgency: 'normal' | 'urgent';
    purpose: string | null;
    created_at?: string;
}

export interface CatalogItem {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    unit: string | null;
    on_hand: number;
    available_quantity: number;
    weekly_request_limit?: number | null;
    quota_remaining?: number;
    quota_week_end?: string;
    user_pre_order?: UserPreOrder | null;
}

export type CatalogSortKey = 'name' | 'sku' | 'unit' | 'on_hand' | 'available';
