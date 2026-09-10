import React from 'react';
import { Link } from '@inertiajs/react';
import { CriticalStockItem } from '../types';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface CriticalStockOverviewProps {
    items?: CriticalStockItem[];
}

export default function CriticalStockOverview({ items = [] }: CriticalStockOverviewProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-red-50 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                Stock Requiring Attention
                            </h3>
                            <p className="text-[11px] text-gray-500">Items nearing or below minimum threshold</p>
                        </div>
                    </div>

                    <Link
                        href={route('inventory.index')}
                        className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline"
                    >
                        View All
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        <p className="text-xs">
                            All tracked inventory items are currently above their critical thresholds.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                                    <th className="pb-2">Item</th>
                                    <th className="pb-2 text-center">Available / Min</th>
                                    <th className="pb-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.slice(0, 5).map((item, idx) => {
                                    const isCritical = item.priority === 'Critical' || item.current <= 5;
                                    return (
                                        <tr key={item.id ?? idx} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="py-2.5 pr-2">
                                                <div className="font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-[220px]">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {item.sku}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 text-center font-mono">
                                                <span className={`font-bold ${isCritical ? 'text-red-700' : 'text-gray-900'}`}>
                                                    {item.current}
                                                </span>
                                                <span className="text-gray-400 mx-1">/</span>
                                                <span className="text-gray-500">{item.min}</span>
                                                <span className="text-[10px] text-gray-400 ml-1">{item.unit}</span>
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

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('inventory.index')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>Manage Inventory & Thresholds</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
