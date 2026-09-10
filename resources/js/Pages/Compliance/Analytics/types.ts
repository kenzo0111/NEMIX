import { PageProps as InertiaPageProps } from '@/types';

export type InventoryStatus =
    | 'Available'
    | 'Low Stock'
    | 'Out of Stock';

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
}>;
