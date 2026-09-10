export interface DashboardSummary {
    total_inventory_value: number;
    available_items: number;
    issued_this_month: number;
    critical_stock: number;
    unserviceable: number;
}

export interface DashboardStats {
    totalInventoryValue?: string;
    totalRisIssued?: number;
    itemsIssuedMtd?: number;
    unserviceable?: number;
    criticalAlerts?: number;
    activeInventoryItems?: number;
}

export interface MovementPoint {
    label: string;
    starting: number;
    stockIn: number;
    risIssued: number;
}

export interface MovementSummary {
    received: number;
    issued: number;
    starting_balance: number;
    ending_balance: number;
}

export interface RecentReceiving {
    id: number;
    item_name: string;
    quantity: number;
    unit: string;
    supplier: string;
    received_at: string;
    received_at_formatted?: string;
    received_by?: string;
}

export interface RecentIssuance {
    id: number;
    ris_number: string;
    item_name?: string;
    recipient: string;
    department?: string;
    total_items: number;
    unit?: string;
    issued_at: string;
    issued_at_formatted?: string;
    issued_by?: string;
    status?: string;
}

export interface CriticalStockItem {
    id?: number;
    name: string;
    sku: string;
    current: number;
    min: number;
    unit: string;
    priority: string;
    status?: string;
}

export interface RfidSummary {
    tagged: number;
    untagged: number;
    total: number;
    percentage: number;
}

export interface SupplierSummary {
    active: number;
    pending: number;
    blacklisted: number;
    total: number;
}

export interface ComplianceSummary {
    reports_this_month: number;
    latest_report?: {
        id: number;
        title: string;
        type: string;
        reference: string;
        date: string;
        created_by: string;
    } | null;
}

export interface RecentActivity {
    id: number | string;
    user: string;
    role?: string;
    module?: string;
    action: string;
    details?: string;
    status?: string;
    badge?: string;
    time: string;
    timestamp?: string;
}

export interface DashboardFilters {
    chartFilter?: string;
    customStartDate?: string;
    customEndDate?: string;
}

export interface DashboardPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role?: string;
            roles?: string[];
            is_active?: boolean;
        };
        permissions?: string[];
        capabilities?: Record<string, any>;
        is_system_admin?: boolean;
    };
    summary?: DashboardSummary;
    stats?: DashboardStats;
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    chartData?: {
        monthly: MovementPoint[];
        yearly: MovementPoint[];
        custom?: MovementPoint[];
    };
    recentReceiving?: RecentReceiving[];
    recentIssuance?: RecentIssuance[];
    criticalStock?: CriticalStockItem[];
    lowStockAlerts?: CriticalStockItem[];
    rfidSummary?: RfidSummary;
    supplierSummary?: SupplierSummary;
    complianceSummary?: ComplianceSummary;
    recentActivity?: RecentActivity[];
    auditLogs?: RecentActivity[];
    filters?: DashboardFilters;
    roles?: Array<{ value: string; label: string }>;
}
