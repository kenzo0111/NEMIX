import React from 'react';
import { Link } from '@inertiajs/react';
import { DashboardSummary, DashboardStats, RfidSummary } from '../types';
import { Package, TrendingUp, AlertTriangle, Boxes, ShieldAlert, Radio, ArrowRight } from 'lucide-react';

interface SystemSummaryProps {
    summary?: DashboardSummary;
    stats?: DashboardStats;
    rfidSummary?: RfidSummary;
    criticalStockCount?: number;
}

export default function SystemSummary({
    summary,
    stats,
    rfidSummary,
    criticalStockCount,
}: SystemSummaryProps) {
    const rawVal = summary?.total_inventory_value ?? 0;
    const formattedVal = stats?.totalInventoryValue || `₱${rawVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = criticalStockCount ?? summary?.critical_stock ?? stats?.criticalAlerts ?? 0;
    const unserviceable = summary?.unserviceable ?? stats?.unserviceable ?? 0;
    const untaggedRfid = rfidSummary?.untagged ?? 0;

    return (
        <section aria-label="Immediate Operational Status" className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Critical Stock - Highest Alert Priority */}
                <Link
                    href={route('inventory.index')}
                    className="bg-red-50/75 border border-red-200/90 hover:border-red-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 truncate">
                                Critical Stock
                            </span>
                            <div className="p-1 rounded-md bg-red-200/60 text-red-900 shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-red-950 tabular-nums">
                            {criticalCount.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-center justify-between text-[11px] text-red-900 font-medium">
                        <span className="truncate">
                            {criticalCount === 1 ? '1 item needs reorder' : `${criticalCount} items need reorder`}
                        </span>
                        <ArrowRight className="w-3 h-3 shrink-0 text-red-800 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </Link>

                {/* 2. Missing RFIDs - Secondary Warning Priority */}
                <Link
                    href={route('rfid-scanner.index')}
                    className="bg-slate-50/90 border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 truncate">
                                Missing RFIDs
                            </span>
                            <div className="p-1 rounded-md bg-slate-200/80 text-slate-700 shrink-0">
                                <Radio className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                            {untaggedRfid.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span className="truncate">Pending assignment</span>
                        <ArrowRight className="w-3 h-3 shrink-0 text-slate-700 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </Link>

                {/* 3. Inventory Value - Neutral Card */}
                <Link
                    href={route('inventory.index')}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 truncate">
                                Inventory Value
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:text-red-900 transition-colors shrink-0">
                                <Boxes className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-lg sm:text-xl xl:text-[22px] font-bold font-serif text-slate-900 tracking-tight tabular-nums truncate">
                            {formattedVal}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        Total on-hand valuation
                    </div>
                </Link>

                {/* 4. Available Items - Neutral Card */}
                <Link
                    href={route('inventory.index')}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 truncate">
                                Available Items
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:text-red-900 transition-colors shrink-0">
                                <Package className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                            {availableItems.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        Active stock lines
                    </div>
                </Link>

                {/* 5. Issued This Month - Neutral Card */}
                <Link
                    href={route('inventory.issuance')}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 truncate">
                                Issued This Month
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:text-red-900 transition-colors shrink-0">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                            {issuedMtd.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        Disbursed via RIS MTD
                    </div>
                </Link>

                {/* 6. Unserviceable - Neutral Card */}
                <Link
                    href={route('inventory.index')}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group min-w-0"
                >
                    <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 truncate">
                                Unserviceable
                            </span>
                            <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:text-red-900 transition-colors shrink-0">
                                <ShieldAlert className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                            {unserviceable.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        Awaiting disposal
                    </div>
                </Link>
            </div>
        </section>
    );
}
