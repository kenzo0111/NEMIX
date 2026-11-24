import React, { useMemo } from 'react';
import { useDashboardScope } from '../useDashboardScope';
import { Link } from '@inertiajs/react';
import { CriticalStockItem } from '../types';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type CriticalSortKey = 'item' | 'stock' | 'status';

interface CriticalStockOverviewProps {
    items?: CriticalStockItem[];
    className?: string;
}

export default function CriticalStockOverview({ items = [], className = '' }: CriticalStockOverviewProps) {
    const { inventoryHref } = useDashboardScope();
    const accessors = useMemo(() => ({
        item: (item: CriticalStockItem) => item.name,
        stock: (item: CriticalStockItem) => item.current,
        status: (item: CriticalStockItem) => item.priority,
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData<CriticalStockItem, CriticalSortKey>(items, accessors, { key: 'stock', direction: 'asc' });
    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full min-w-0 transition-colors ${className}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-lg font-semibold normal-case tracking-normal text-slate-900 dark:text-slate-100 truncate">
                            Stock Requiring Attention
                        </h3>
                    </div>
                </div>

                {/* Compact List / Table */}
                {items.length === 0 ? (
                    <div className="py-5 text-center text-slate-500 dark:text-slate-400">
                        <p className="leading-relaxed text-sm">
                            All tracked inventory items are currently above their critical thresholds.
                        </p>
                    </div>
                ) : (
                    <div className="w-full min-w-0 overflow-x-auto">
                        <table className="ui-data-table w-full text-left text-sm min-w-[26rem]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold normal-case text-sm tracking-normal">
                                    <SortableTableHeader column="item" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="pb-2 w-auto align-middle">Item</SortableTableHeader>
                                    <SortableTableHeader column="stock" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="center" className="pb-2 w-36 sm:w-44 align-middle">Available / Min</SortableTableHeader>
                                    <SortableTableHeader column="status" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="pb-2 w-24 sm:w-28 align-middle">Status</SortableTableHeader>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedRows.map((item, idx) => {
                                    const isCritical = item.priority === 'Critical';
                                    return (
                                        <tr key={item.id ?? idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                                            <td className="py-3 pr-3 min-w-0 align-middle">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px] sm:max-w-[360px]">
                                                    {item.name}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                                                    {item.sku}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-center tabular-nums whitespace-nowrap align-middle">
                                                <span className={`font-semibold ${isCritical ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                                                    {item.current}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400 mx-1">/</span>
                                                <span className="text-slate-600 dark:text-slate-300">{item.min}</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{item.unit}</span>
                                            </td>
                                            <td className="py-3 pl-2 text-right whitespace-nowrap align-middle">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold normal-case tracking-normal ${isCritical
    ? "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 ring-1 ring-red-600/20 dark:ring-red-500/30" : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 ring-1 ring-amber-600/20 dark:ring-amber-500/30"}`}
                                                >
                                                    {item.status || (isCritical ? 'Critical' : 'Low')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                    href={inventoryHref}
                    className="text-sm font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>View All Inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
