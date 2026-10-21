import React from 'react';
import { useDashboardScope } from '../useDashboardScope';
import { Link } from '@inertiajs/react';
import { DashboardSummary, DashboardStats } from '../types';
import { Package, TrendingUp, AlertTriangle, Boxes, ShieldAlert, ArrowRight } from 'lucide-react';

interface SystemSummaryProps {
    summary?: DashboardSummary;
    stats?: DashboardStats;
    criticalStockCount?: number;
}

export default function SystemSummary({
    summary,
    stats,
    criticalStockCount,
}: SystemSummaryProps) {
    const { inventoryHref, issuanceHref, isCoordinator } = useDashboardScope();
    const rawVal = summary?.total_inventory_value ?? 0;
    const formattedVal = stats?.totalInventoryValue || `₱${rawVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = criticalStockCount ?? summary?.critical_stock ?? stats?.criticalAlerts ?? 0;
    const unserviceable = summary?.unserviceable ?? stats?.unserviceable ?? 0;

    return (
        <section aria-label="Immediate Operational Status" className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                {/* 1. Critical Stock - Highest Alert Priority */}
                <Link
                    href={inventoryHref}
                    className="bg-red-50/75 dark:bg-red-950/40 border border-red-200/90 dark:border-red-800/80 hover:border-red-300 dark:hover:border-red-700 hover:shadow-xs rounded-xl p-3.5 flex flex-col justify-between transition-all group min-w-0 min-h-[110px]"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-bold normal-case tracking-normal text-red-950 dark:text-red-200 truncate">
                                Critical Stock
                            </span>
                            <div className="p-1 rounded-md bg-red-200/60 dark:bg-red-900/60 text-red-900 dark:text-red-300 shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-red-950 dark:text-red-200 tabular-nums">
                            {criticalCount.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-red-200/60 dark:border-red-800/60 flex items-center justify-between text-sm text-red-900 dark:text-red-300 font-medium">
                        <span className="truncate">
                            {criticalCount === 1 ? '1 item needs reorder' : `${criticalCount} items need reorder`}
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0 text-red-800 dark:text-red-300 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </Link>

                {/* 2. Inventory Value - Neutral Card */}
                <Link
                    href={inventoryHref}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs rounded-xl p-3.5 flex flex-col justify-between transition-all group min-w-0 min-h-[110px]"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold normal-case tracking-normal text-slate-600 dark:text-slate-400 truncate">
                                Inventory Value
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-red-900 dark:group-hover:text-amber-300 transition-colors shrink-0">
                                <Boxes className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-slate-100 tracking-tight tabular-nums truncate">
                            {formattedVal}
                        </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                        Total on-hand valuation
                    </div>
                </Link>

                {/* 3. Available Items - Neutral Card */}
                <Link
                    href={inventoryHref}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs rounded-xl p-3.5 flex flex-col justify-between transition-all group min-w-0 min-h-[110px]"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold normal-case tracking-normal text-slate-600 dark:text-slate-400 truncate">
                                Available Items
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-red-900 dark:group-hover:text-amber-300 transition-colors shrink-0">
                                <Package className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100 tabular-nums">
                            {availableItems.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                        Active stock lines
                    </div>
                </Link>

                {/* 4. Issued This Month - Neutral Card */}
                <Link
                    href={issuanceHref}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs rounded-xl p-3.5 flex flex-col justify-between transition-all group min-w-0 min-h-[110px]"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold normal-case tracking-normal text-slate-600 dark:text-slate-400 truncate">
                                Issued This Month
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-red-900 dark:group-hover:text-amber-300 transition-colors shrink-0">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100 tabular-nums">
                            {issuedMtd.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                        {isCoordinator ? 'Issued within your Delivery Unit MTD' : 'Disbursed via RIS MTD'}
                    </div>
                </Link>

                {/* 5. Unserviceable - Neutral Card */}
                <Link
                    href={inventoryHref}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs rounded-xl p-3.5 flex flex-col justify-between transition-all group min-w-0 min-h-[110px]"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold normal-case tracking-normal text-slate-600 dark:text-slate-400 truncate">
                                {isCoordinator ? 'Out of Stock' : 'Unserviceable'}
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-red-900 dark:group-hover:text-amber-300 transition-colors shrink-0">
                                <ShieldAlert className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100 tabular-nums">
                            {unserviceable.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                        {isCoordinator ? 'Request replenishment from Supply Office' : 'Awaiting disposal'}
                    </div>
                </Link>
            </div>
        </section>
    );
}
