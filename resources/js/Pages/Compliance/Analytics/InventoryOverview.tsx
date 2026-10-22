import React, { useState } from 'react';
import { InventoryAnalyticsProps } from './types';
import AnalyticsSummary from './Components/AnalyticsSummary';
import StockAttentionTable from './Components/StockAttentionTable';
import StockExtremes from './Components/StockExtremes';
import FocusedItemsModal from './Components/FocusedItemsModal';
import StockQuantityChart from './Charts/StockQuantityChart';
import InventoryValuationChart from './Charts/InventoryValuationChart';
import InventoryStatusChart from './Charts/InventoryStatusChart';

export default function InventoryOverview({ analytics }: { analytics: InventoryAnalyticsProps }) {
    const [open, setOpen] = useState(false);
    return (
        <details className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer font-semibold">Current inventory overview</summary>
            <p className="my-4 text-sm text-slate-500">
                Current stock and valuation across central inventory. These point-in-time balances are independent of
                the reporting period above.
            </p>
            <div className="space-y-6">
                <AnalyticsSummary
                    stats={analytics.stats}
                    statusCounts={analytics.statusCounts}
                    onOpenDrillDown={() => setOpen(true)}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                        <h3 className="mb-4 font-semibold">Stock Quantity by Item</h3>
                        <StockQuantityChart items={analytics.chartData.stockItems} />
                    </div>
                    <div>
                        <h3 className="mb-4 font-semibold">Inventory Status</h3>
                        <InventoryStatusChart statusCounts={analytics.statusCounts} />
                    </div>
                </div>
                <h3 className="font-semibold">Inventory Valuation by Item</h3>
                <InventoryValuationChart items={analytics.chartData.valueItems} />
                <StockAttentionTable items={analytics.lowStockItems} />
                <StockExtremes highest={analytics.consumables.highest} lowest={analytics.consumables.lowest} />
            </div>
            <FocusedItemsModal show={open} onClose={() => setOpen(false)} items={analytics.items} />
        </details>
    );
}
