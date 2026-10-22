import { PageProps as InertiaPageProps } from '@/types';

export type InventoryStatus = 'Available' | 'Low Stock' | 'Out of Stock';

export interface InventoryAnalyticsItem {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unitCost: number;
    amount: number;
    status: InventoryStatus | string;
    unitOfIssue: string;
    description?: string | null;
}

export interface AnalyticsStats {
    totalItems: number;
    totalStock: number;
    lowStockAlerts: number;
    outOfStock: number;
    totalValue: string;
    highestConsumable: string;
    lowestConsumable: string;
}

export interface ChartRankingItem {
    label: string;
    value: number;
    meta?: string;
    color?: string;
}

export interface InventoryAnalyticsProps {
    stats: AnalyticsStats;
    items: InventoryAnalyticsItem[];
    lowStockItems: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'amount'>>;
    consumables: {
        highest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
        lowest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
    };
    statusCounts: {
        Available: number;
        'Low Stock': number;
        'Out of Stock': number;
    };
    chartData: {
        stockItems: ChartRankingItem[];
        valueItems: ChartRankingItem[];
        lowStockItems: ChartRankingItem[];
        statusSeries: Array<{ label: string; value: number; color?: string }>;
    };
}

export type ManageAnalyticsPageProps = InertiaPageProps<{
    analytics?: InventoryAnalyticsProps;
    supplyAnalytics: SupplyAnalytics;
}>;

export interface DepartmentUsage {
    name: string;
    requisitions: number;
    requested: number;
    issued: number;
    topItem: string;
    distinctItems: number;
    previousRequested: number;
    demandChange: number;
}
export interface ItemDemand {
    id: number;
    name: string;
    frequency: number;
    requested: number;
    issued: number;
    latest: string | null;
    category?: string;
    offices?: number;
    department?: string;
}
export interface SupplyTrend {
    month: string;
    requisitions: number;
    requested: number;
    issued: number;
    topItem: string;
}
export interface SupplyStats {
    totalRequisitions: number;
    mostRequestedItem: string;
    highestDepartment: string;
    lowestDepartment: string;
    totalIssued: number;
    activeOffices: number;
}
export interface SupplyAnalytics {
    demandHistory: {
        id: string;
        department: string;
        name: string;
        month: string;
        frequency: number;
        requested: number;
        issued: number;
    }[];
    departmentTrends: (SupplyTrend & { department: string })[];
    stats: SupplyStats;
    departments: DepartmentUsage[];
    items: ItemDemand[];
    demand: ItemDemand[];
    trends: SupplyTrend[];
    filters: Record<string, string | number>;
    options: { departments: string[]; categories: string[]; items: { id: number; name: string }[] };
    comparison: { start: string; end: string; stats: SupplyStats; trends: SupplyTrend[] };
}
