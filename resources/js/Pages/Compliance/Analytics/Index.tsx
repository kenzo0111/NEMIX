import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { ManageAnalyticsPageProps, InventoryAnalyticsProps } from './types';

import AnalyticsSummary from './Components/AnalyticsSummary';
import StockAttentionTable from './Components/StockAttentionTable';
import StockExtremes from './Components/StockExtremes';
import FocusedItemsModal from './Components/FocusedItemsModal';

import StockQuantityChart from './Charts/StockQuantityChart';
import InventoryValuationChart from './Charts/InventoryValuationChart';
import InventoryStatusChart from './Charts/InventoryStatusChart';

const fallbackAnalytics: InventoryAnalyticsProps = {
    stats: {
        totalItems: 0,
        totalStock: 0,
        lowStockAlerts: 0,
        outOfStock: 0,
        totalValue: '₱0.00',
        highestConsumable: 'N/A',
        lowestConsumable: 'N/A',
    },
    items: [],
    lowStockItems: [],
    consumables: {
        highest: [],
        lowest: [],
    },
    statusCounts: {
        Available: 0,
        'Low Stock': 0,
        'Out of Stock': 0,
    },
    chartData: {
        stockItems: [],
        valueItems: [],
        lowStockItems: [],
        statusSeries: [],
    },
};

export default function AnalyticsIndex(props: ManageAnalyticsPageProps) {
    const pageProps = usePage<ManageAnalyticsPageProps>().props;
    const user = props.auth?.user || pageProps.auth?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showDrillDown, setShowDrillDown] = useState(false);

    const analytics = props.analytics || pageProps.analytics || fallbackAnalytics;
    const stats = analytics.stats || fallbackAnalytics.stats;
    const statusCounts = analytics.statusCounts || fallbackAnalytics.statusCounts;
    const chartData = analytics.chartData || fallbackAnalytics.chartData;
    const allItems = analytics.items || fallbackAnalytics.items;
    const lowStockItems = analytics.lowStockItems || fallbackAnalytics.lowStockItems;
    const consumables = analytics.consumables || fallbackAnalytics.consumables;

    const modules = getSidebarModules('Compliance', 'Manage Analytics');

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Inventory Performance Analytics" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <PageHeader
                    title="Inventory Performance Analytics"
                    description="Institutional stock holding, inventory valuation, status distribution, and replenishment analysis"
                    breadcrumbs={[{ name: 'Compliance' }, { name: 'Manage Analytics' }]}
                />

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Compact Analytics Summary: Hero Banner + 4 KPI Cards */}
                    <AnalyticsSummary
                        stats={stats}
                        statusCounts={statusCounts}
                        onOpenDrillDown={() => setShowDrillDown(true)}
                    />

                    {/* Stock Distribution Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Stock Quantity by Item (Horizontal Bar Chart) */}
                        <div className="xl:col-span-2">
                            <Card className="h-full flex flex-col justify-between">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
                                    <CardTitle className="text-sm font-bold text-gray-900 font-serif">
                                        Stock Quantity by Item
                                    </CardTitle>
                                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                                        Top inventory items ranked by current available on-hand volume
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col justify-center">
                                    <StockQuantityChart items={chartData.stockItems} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Inventory Status Distribution (Donut Pie Chart) */}
                        <div className="xl:col-span-1">
                            <Card className="h-full flex flex-col justify-between">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
                                    <CardTitle className="text-sm font-bold text-gray-900 font-serif">
                                        Inventory Status
                                    </CardTitle>
                                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                                        Overall distribution by availability threshold
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col justify-center">
                                    <InventoryStatusChart statusCounts={statusCounts} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Inventory Valuation Section */}
                    <Card>
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
                            <CardTitle className="text-sm font-bold text-gray-900 font-serif">
                                Inventory Valuation by Item
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                                Top registered items ranked by calculated financial value in Philippine pesos (₱)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <InventoryValuationChart items={chartData.valueItems} />
                        </CardContent>
                    </Card>

                    {/* Stock Requiring Attention (Actionable Table) */}
                    <StockAttentionTable items={lowStockItems} />

                    {/* Stock Extremes: Highest & Lowest Consumables */}
                    <StockExtremes
                        highest={consumables.highest}
                        lowest={consumables.lowest}
                    />
                </div>
            </main>

            {/* Focused Drill-down Modal */}
            <FocusedItemsModal
                show={showDrillDown}
                onClose={() => setShowDrillDown(false)}
                items={allItems}
            />
        </div>
    );
}
