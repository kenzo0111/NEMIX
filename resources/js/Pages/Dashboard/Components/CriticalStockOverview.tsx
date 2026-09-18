import React from 'react';
import { Link } from '@inertiajs/react';
import { CriticalStockItem } from '../types';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface CriticalStockOverviewProps {
    items?: CriticalStockItem[];
    className?: string;
}

export default function CriticalStockOverview({ items = [], className = '' }: CriticalStockOverviewProps) {
    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-red-50 text-red-700 shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                            Stock Requiring Attention
                        </h3>
                    </div>
                </div>

                {/* Compact List / Table */}
                {items.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                        <p className="text-xs">
                            All tracked inventory items are currently above their critical thresholds.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                    <th className="pb-2">Item</th>
                                    <th className="pb-2 text-center">Available / Min</th>
                                    <th className="pb-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.slice(0, 5).map((item, idx) => {
                                    const isCritical = item.priority === 'Critical' || item.current <= 5;
                                    return (
                                        <tr key={item.id ?? idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2.5 pr-2">
                                                <div className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {item.sku}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-mono">
                                                <span className={`font-bold ${isCritical ? 'text-red-700' : 'text-slate-900'}`}>
                                                    {item.current}
                                                </span>
                                                <span className="text-slate-400 mx-1">/</span>
                                                <span className="text-slate-600">{item.min}</span>
                                                <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                                            </td>
                                            <td className="py-2.5 pl-2 text-right">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        isCritical
                                                            ? 'bg-red-50 text-red-800 ring-1 ring-red-600/20'
                                                            : 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20'
                                                    }`}
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
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex justify-end">
                <Link
                    href={route('inventory.index')}
                    className="text-xs font-medium text-red-950 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                    <span>View All Inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
