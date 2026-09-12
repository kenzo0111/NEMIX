export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unit_of_issue?: string;
    unit_cost?: number;
}

export interface IssuanceLine {
    item_id: string;
    quantity: string;
}

export interface IssuanceItemDetail {
    id: number;
    item_id: number;
    item: string;
    item_name?: string;
    sku: string;
    stock_no?: string;
    quantity: number;
    unit_cost: number;
    amount: number;
    unit?: string;
}

export interface IssuanceRecord {
    id: number;
    ris_number: string;
    recipient: string;
    department: string;
    recipient_designation?: string;
    date_issued: string;
    date: string;
    fund_cluster?: string;
    purpose?: string;
    status: 'Pending' | 'Issued' | 'Cancelled';
    approved_by: string;
    approved_by_designation: string;
    issued_by: string;
    issued_by_name?: string;
    issued_by_position?: string;
    item?: string;
    sku?: string;
    total_quantity: number;
    total_amount: number;
    amount?: number;
    quantity?: number;
    items: IssuanceItemDetail[];
    items_list?: IssuanceItemDetail[];
    created_at?: string;
}

export interface PaginationLink {
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
    from?: number;
    to?: number;
    links?: PaginationLink[];
}

export interface DivisionOption {
    value: string;
    label: string;
}

export interface DivisionGroup {
    label: string;
    options: DivisionOption[];
}

export interface IssuancePageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role?: string;
        };
    };
    issuances: PaginatedData<IssuanceRecord> | IssuanceRecord[];
    items: InventoryItem[];
    recipients?: string[];
    divisions?: DivisionGroup[];
    filters?: {
        search?: string;
        recipient?: string;
    };
    systemSettings?: import('@/types').SystemSettings;
    system?: {
        settings?: Record<string, any>;
    };
}
