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
        <>
            {/* Total Inventory Value */}
            <Link
                href={route('inventory.index')}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-red-900/40 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm col-span-1"
            >
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-gray-500 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Inventory Value
                        </span>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:text-red-900 group-hover:bg-red-50 transition-colors shrink-0">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-serif text-gray-950 tracking-tight tabular-nums break-words min-w-0">
                        {formattedVal}
                    </div>
                </div>
                <div className="text-xs text-gray-600 font-medium mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
                    <span>Total on-hand valuation</span>
                </div>
            </Link>

            {/* Available Inventory Items */}
            <Link
                href={route('inventory.index')}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-700/40 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm col-span-1"
            >
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-gray-500 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Available Items
                        </span>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors shrink-0">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-mono tabular-nums break-words min-w-0">
                        {availableItems.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs text-gray-600 font-medium mt-3 pt-3 border-t border-gray-100">
                    <span>Tracked stock lines</span>
                </div>
            </Link>

            {/* Items Issued This Month */}
            <Link
                href={route('inventory.issuance')}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-700/40 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm col-span-1"
            >
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-gray-500 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Issued This Month
                        </span>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:text-blue-700 group-hover:bg-blue-50 transition-colors shrink-0">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-mono tabular-nums break-words min-w-0">
                        {issuedMtd.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs text-gray-600 font-medium mt-3 pt-3 border-t border-gray-100">
                    <span>Disbursed via RIS MTD</span>
                </div>
            </Link>

            {/* Unserviceable / Disposals */}
            <Link
                href={route('inventory.index')}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-700/40 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm col-span-1"
            >
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-gray-500 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Unserviceable
                        </span>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:text-amber-700 group-hover:bg-amber-50 transition-colors shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-mono tabular-nums break-words min-w-0">
                        {unserviceable.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs text-gray-600 font-medium mt-3 pt-3 border-t border-gray-100">
                    <span>Items awaiting disposal</span>
                </div>
            </Link>
        </>
    );
}
