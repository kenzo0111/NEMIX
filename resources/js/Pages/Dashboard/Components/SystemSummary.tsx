import React from 'react';
import { Link } from '@inertiajs/react';
import { DashboardSummary, DashboardStats } from '../types';
import { Package, TrendingUp, AlertOctagon, Boxes, ShieldAlert } from 'lucide-react';

interface SystemSummaryProps {
    summary?: DashboardSummary;
    stats?: DashboardStats;
}

export default function SystemSummary({ summary, stats }: SystemSummaryProps) {
    const rawVal = summary?.total_inventory_value ?? 0;
    const formattedVal = stats?.totalInventoryValue || `₱${rawVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalStock = summary?.critical_stock ?? stats?.criticalAlerts ?? 0;
    const unserviceable = summary?.unserviceable ?? stats?.unserviceable ?? 0;

    return (
        <section aria-label="System Summary Metrics">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    System Summary Metrics
                </h2>
                <span className="text-[11px] text-gray-500 font-medium">
                    Institutional Supplies & Inventory
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {/* Total Inventory Value */}
                <Link
                    href={route('inventory.index')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-900/40 hover:shadow-xs transition-all group"
                >
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Inventory Value
                        </span>
                        <div className="p-1.5 rounded-md bg-gray-50 text-gray-600 group-hover:text-red-900 group-hover:bg-red-50 transition-colors">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold font-serif text-gray-950 truncate tracking-tight">
                        {formattedVal}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-1 flex items-center gap-1">
                        <span>Total on-hand valuation</span>
                    </div>
                </Link>

                {/* Available Inventory Items */}
                <Link
                    href={route('inventory.index')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-900/40 hover:shadow-xs transition-all group"
                >
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Available Items
                        </span>
                        <div className="p-1.5 rounded-md bg-gray-50 text-gray-600 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-gray-950 tracking-tight font-mono">
                        {availableItems.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-1">
                        <span>Tracked stock lines</span>
                    </div>
                </Link>

                {/* Items Issued This Month */}
                <Link
                    href={route('inventory.issuance')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-900/40 hover:shadow-xs transition-all group"
                >
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Issued This Month
                        </span>
                        <div className="p-1.5 rounded-md bg-gray-50 text-gray-600 group-hover:text-blue-700 group-hover:bg-blue-50 transition-colors">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-gray-950 tracking-tight font-mono">
                        {issuedMtd.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-1">
                        <span>Disbursed via RIS MTD</span>
                    </div>
                </Link>

                {/* Critical Stock Alerts */}
                <Link
                    href={route('inventory.index')}
                    className={`border rounded-lg p-4 transition-all group ${
                        criticalStock > 0
                            ? 'bg-red-50/40 border-red-200 hover:border-red-300 hover:shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${criticalStock > 0 ? 'text-red-900' : 'text-gray-600'}`}>
                            Critical Stock
                        </span>
                        <div className={`p-1.5 rounded-md ${criticalStock > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                            <AlertOctagon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-xl font-bold tracking-tight font-mono ${criticalStock > 0 ? 'text-red-700' : 'text-gray-950'}`}>
                        {criticalStock.toLocaleString()}
                    </div>
                    <div className={`text-[11px] font-medium mt-1 ${criticalStock > 0 ? 'text-red-800' : 'text-gray-500'}`}>
                        <span>{criticalStock > 0 ? 'Items below minimum' : 'All thresholds normal'}</span>
                    </div>
                </Link>

                {/* Unserviceable / Disposals (Optional 5th card on large screens) */}
                <div className="hidden xl:block bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Unserviceable
                        </span>
                        <div className="p-1.5 rounded-md bg-gray-50 text-gray-600">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-gray-950 tracking-tight font-mono">
                        {unserviceable.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-1">
                        <span>Items awaiting review/disposal</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
