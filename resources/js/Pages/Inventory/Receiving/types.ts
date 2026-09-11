export interface Supplier {
    id: number;
    name: string;
}

export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    rfid_tag?: string | null;
    supplier_id?: number | null;
    supplier_name?: string | null;
    description?: string | null;
    unit_of_issue?: string | null;
    stock?: number;
}

export interface ReceivingRecord {
    id: number;
    item_id: number;
    supplier_id: number;
    item: string;
    sku: string;
    unit?: string;
    supplier: string;
    quantity: number;
    quantity_remaining?: number | null;
    unit_cost?: number | null;
    amount?: number | null;
    date: string;
    date_received?: string;
}

export interface ReceivingFormData {
    item_id: number | '';
    supplier_id: number | '';
    quantity: number | '';
    unit_cost?: number | string;
    date_received: string;
}

export interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginatedLink[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface ReceivingFilters {
    search?: string;
    supplier?: number | string;
    page?: number;
}

export interface ReceivingPageProps {
    auth: {
        user: any;
    };
    receivings: PaginatedData<ReceivingRecord> | ReceivingRecord[];
    items: InventoryItem[];
    suppliers: Supplier[];
    filters?: ReceivingFilters;
}
