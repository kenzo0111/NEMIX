import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { InventoryAnalyticsItem } from '../types';

interface StockExtremesProps {
    highest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
    lowest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
}

export default function StockExtremes({ highest, lowest }: StockExtremesProps) {
    return (
        <Card>
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
                <CardTitle className="text-sm font-bold text-gray-900 font-serif">
                    Stock Volume Extremes
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Highest on-hand consumable holdings compared against lowest inventory levels
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Highest Stock Column */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-900">
                                Highest Stock Consumables
                            </h4>
                            <span className="text-[11px] font-medium text-emerald-700">
                                Top Available
                            </span>
                        </div>

                        {highest && highest.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {highest.map((item, index) => (
                                    <div
                                        key={`high-${item.id}`}
                                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xs font-semibold text-gray-400 font-mono w-4 shrink-0">
                                                {index + 1}.
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-[11px] text-gray-500 font-mono truncate">
                                                    SKU: {item.sku || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-semibold text-gray-900 font-mono">
                                                {Number(item.stock).toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 ml-1 text-[11px]">
                                                {item.unitOfIssue || 'units'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-xs text-gray-400">
                                No records recorded.
                            </p>
                        )}
                    </div>

                    {/* Lowest Stock Column */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-900">
                                Lowest Stock Consumables
                            </h4>
                            <span className="text-[11px] font-medium text-amber-700">
                                Replenishment Priority
                            </span>
                        </div>

                        {lowest && lowest.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {lowest.map((item, index) => (
                                    <div
                                        key={`low-${item.id}`}
                                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xs font-semibold text-gray-400 font-mono w-4 shrink-0">
                                                {index + 1}.
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-[11px] text-gray-500 font-mono truncate">
                                                    SKU: {item.sku || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-semibold text-gray-900 font-mono">
                                                {Number(item.stock).toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 ml-1 text-[11px]">
                                                {item.unitOfIssue || 'units'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-xs text-gray-400">
                                No records recorded.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
