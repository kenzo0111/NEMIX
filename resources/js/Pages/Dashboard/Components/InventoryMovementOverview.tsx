import React from 'react';
import { Link, router } from '@inertiajs/react';
import { MovementPoint, MovementSummary } from '../types';
import InventoryMovementChart from '../Charts/InventoryMovementChart';
import { ArrowRight } from 'lucide-react';

interface InventoryMovementOverviewProps {
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    currentFilter?: string;
    className?: string;
}

export default function InventoryMovementOverview({
    movement = [],
    movementSummary,
    currentFilter = 'monthly',
    className = '',
}: InventoryMovementOverviewProps) {
    const handleFilterChange = (newFilter: 'monthly' | 'yearly') => {
        router.get(
            route('dashboard'),
            { chart_filter: newFilter },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const receivedCount = movementSummary?.received ?? movement.reduce((acc, m) => acc + m.stockIn, 0);
    const issuedCount = movementSummary?.issued ?? movement.reduce((acc, m) => acc + m.risIssued, 0);
    const endingBalance = movementSummary?.ending_balance ?? 0;

    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 transition-colors ${className}`}>
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-red-900 dark:bg-red-400 shrink-0"></span>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                        Inventory Movement Overview
                    </h2>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {/* Simplified Period Toggle: Monthly / Yearly */}
                    <div
                        role="group"
                        aria-label="Movement chart period"
                        className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shrink-0"
                    >
                        <button
                            type="button"
                            aria-pressed={currentFilter === 'monthly'}
                            onClick={() => handleFilterChange('monthly')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                currentFilter === 'monthly'
                                    ? 'bg-white dark:bg-slate-900 text-red-950 dark:text-amber-300 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Last 6 Months
                        </button>
                        <button
                            type="button"
                            aria-pressed={currentFilter === 'yearly'}
                            onClick={() => handleFilterChange('yearly')}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                currentFilter === 'yearly'
                                    ? 'bg-white dark:bg-slate-900 text-red-950 dark:text-amber-300 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Last 5 Years
                        </button>
                    </div>

                    <Link
                        href={route('compliance.analytics')}
                        className="text-xs font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                        <span>Analytics</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Visual Movement Chart */}
            <div className="pt-2.5 flex flex-col min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    {/* Custom Legend */}
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] font-medium">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                            <span className="text-slate-600 dark:text-slate-300">Stock Received</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                            <span className="text-slate-600 dark:text-slate-300">Items Issued (RIS)</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-3 h-0.5 rounded-full bg-red-900 dark:bg-red-400"></span>
                            <span className="text-slate-600 dark:text-slate-300">Stock Balance Trend</span>
                        </div>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {currentFilter === 'yearly' ? 'Annual Consolidated' : 'Monthly Tracking'}
                    </div>
                </div>

                <div className="w-full">
                    <InventoryMovementChart data={movement} />
                </div>
            </div>

            {/* Concise Period Movement Summary Row */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 sm:gap-3 text-left shrink-0">
                <div className="border-r border-slate-100 dark:border-slate-800 pr-2 sm:pr-3">
                    <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Received
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block truncate">
                        +{receivedCount.toLocaleString()} <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 font-normal">units</span>
                    </span>
                </div>

                <div className="border-r border-slate-100 dark:border-slate-800 pr-2 sm:pr-3">
                    <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Dispatched
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5 block truncate">
                        -{issuedCount.toLocaleString()} <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 font-normal">units</span>
                    </span>
                </div>

                <div>
                    <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Current Balance
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                        {endingBalance.toLocaleString()} <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 font-normal">units</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
