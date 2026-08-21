export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    is_active?: boolean;
    role?: string;
    roles?: string[];
}

export interface Supplier {
    id: number;
    name: string;
    tin: string;
    address: string;
    reg_number: string;
    category: string;
    status: 'active' | 'pending' | 'blacklisted' | string;
    amount?: number | string | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Item {
    id: number;
    name: string;
    sku?: string | null;
    stock: number;
    unit_cost?: number | string | null;
    amount?: number | string | null;
    status: 'Available' | 'Low Stock' | 'Out of Stock' | string;
    description?: string | null;
    unit_of_issue?: string | null;
    supplier_id?: number | null;
    supplier?: Supplier | null;
    supplier_name?: string | null;
    rfid_tag?: string | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Receiving {
    id: number;
    item_id?: number;
    item?: string | Item;
    sku?: string;
    quantity: number;
    supplier?: string | Supplier;
    supplier_id?: number;
    date?: string;
    date_received?: string;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Issuance {
    id: number;
    item_id?: number;
    item?: string | Item;
    sku?: string;
    quantity: number;
    unit_cost?: number;
    amount?: number;
    recipient: string;
    department?: string | null;
    fund_cluster?: string | null;
    recipient_designation?: string | null;
    purpose?: string | null;
    approved_by?: string | null;
    approved_by_designation?: string | null;
    date?: string;
    date_issued?: string;
    status: 'Pending' | 'Issued' | 'Cancelled' | string;
    issued_by?: string | number;
    created_at?: string;
    updated_at?: string;
}

export interface ComplianceReport {
    id: number;
    title: string;
    type: string;
    reference: string;
    itemName?: string | null;
    supplierId?: number | null;
    supplierName?: string | null;
    endUser?: string | null;
    payload?: Record<string, unknown>;
    date?: string | null;
    periodType: 'specific' | 'range' | 'monthly' | 'yearly' | string;
    dateValue?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    selectedMonth?: number | null;
    selectedYear?: number | null;
    created_by?: number | null;
}

export interface LoginTrail {
    id: number;
    name: string;
    email: string;
    role: string;
    time: string;
    ip: string;
    status: string;
}

export interface TransactionTrail {
    id: string | number;
    user: string;
    role: string;
    action: string;
    details: string;
    time: string;
    module: string;
    status: string;
    badge?: string;
    timestamp?: string;
}

export interface SystemConfigurationState {
    mode: 'LIVE PRODUCTION' | 'MAINTENANCE MODE' | 'STAGING SANDBOX' | 'TRAINING SIMULATION' | string;
    previous_mode?: string | null;
    env?: string;
    status?: string;
    server_node?: string;
    ping_ms?: number;
    security_status?: string;
    changed_by?: string;
    changed_at?: string;
    changed_at_iso?: string | null;
    change_reason?: string | null;
    version?: string;
}

export interface FlashMessages {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    status?: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        permissions?: string[];
        is_system_admin?: boolean;
    };
    system?: SystemConfigurationState;
    flash?: FlashMessages;
};
