import React from 'react';
import { Package, Boxes, AlertTriangle, PhilippinePeso } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';
import { AnalyticsStats } from '../types';

interface AnalyticsSummaryProps {
    stats: AnalyticsStats;
    statusCounts: {
        Available: number;
        'Low Stock': number;
        'Out of Stock': number;
    };
    onOpenDrillDown?: () => void;
}

export default function AnalyticsSummary({
    stats,
    statusCounts,
    onOpenDrillDown,
}: AnalyticsSummaryProps) {
    const attentionCount = (stats.lowStockAlerts || 0) + (stats.outOfStock || 0);

    const kpiCards = [
        {
            title: 'Total Inventory Items',
            value: stats.totalItems?.toLocaleString() ?? '0',
            description: 'Active records in database',
            icon: Package,
            iconColor: 'text-red-900',
            iconBg: 'bg-red-50 border-red-100',
            clickable: true,
            onClick: onOpenDrillDown,
        },
        {
            title: 'Total Stock Quantity',
            value: stats.totalStock?.toLocaleString() ?? '0',
            description: 'Combined on-hand stock units',
            icon: Boxes,
            iconColor: 'text-blue-900',
            iconBg: 'bg-blue-50 border-blue-100',
            clickable: false,
        },
        {
            title: 'Total Inventory Valuation',
            value: stats.totalValue || '₱0.00',
            description: 'Calculated stored item value',
            icon: PhilippinePeso,
            iconColor: 'text-emerald-800',
            iconBg: 'bg-emerald-50 border-emerald-100',
            clickable: false,
        },
        {
            title: 'Items Requiring Attention',
            value: attentionCount.toLocaleString(),
            description: `${stats.lowStockAlerts || 0} low stock • ${stats.outOfStock || 0} out of stock`,
            icon: AlertTriangle,
            iconColor: attentionCount > 0 ? 'text-amber-800' : 'text-gray-600',
            iconBg: attentionCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100',
            clickable: false,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Restrained Institutional Hero Banner */}
            <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-500 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-800 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                            Supply & Property Management Office
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                            Inventory Performance Analytics
                        </h1>
                        <p className="text-red-200/90 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
                            Analyze stock quantity, inventory valuation, availability distributions, and replenishment conditions across registered university supplies.
                        </p>
                    </div>

                    {/* Inline Restrained Status Overview Strip */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-red-200">Available:</span>
                            <span className="font-bold text-white font-mono">{statusCounts?.Available?.toLocaleString() ?? 0}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="text-red-200">Low Stock:</span>
                            <span className="font-bold text-amber-300 font-mono">{statusCounts?.['Low Stock']?.toLocaleString() ?? 0}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            <span className="text-red-200">Out of Stock:</span>
                            <span className="font-bold text-red-300 font-mono">{statusCounts?.['Out of Stock']?.toLocaleString() ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Essential KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.title}
                            className={`border-t-2 border-t-red-900 transition-all ${
                                card.clickable
                                    ? 'cursor-pointer hover:shadow-md hover:border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-red-900'
                                    : ''
                            }`}
                            onClick={card.onClick}
                            role={card.clickable ? 'button' : undefined}
                            tabIndex={card.clickable ? 0 : undefined}
                            onKeyDown={
                                card.clickable
                                    ? (e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              card.onClick?.();
                                          }
                                      }
                                    : undefined
                            }
                        >
                            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600">
                                        {card.title}
                                    </span>
                                    <div className={`p-2 rounded-md border ${card.iconBg}`}>
                                        <Icon className={`h-4 w-4 ${card.iconColor}`} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-sans">
                                        {card.value}
                                    </div>
                                    <div className="text-[11px] font-medium text-gray-500 mt-0.5 flex items-center justify-between">
                                        <span>{card.description}</span>
                                        {card.clickable && (
                                            <span className="text-[10px] font-semibold text-red-900 hover:underline">
                                                Inspect →
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
