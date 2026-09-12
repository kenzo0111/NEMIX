import React from 'react';
import { Link, router } from '@inertiajs/react';
import { MovementPoint, MovementSummary } from '../types';
import InventoryMovementChart from '../Charts/InventoryMovementChart';
import { ArrowUpRight } from 'lucide-react';

interface InventoryMovementOverviewProps {
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    currentFilter?: string;
}

export default function InventoryMovementOverview({
    movement = [],
    movementSummary,
    currentFilter = 'monthly',
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
        <section aria-label="Inventory Movement Overview" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-xs">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-900"></span>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            Inventory Movement Overview
                        </h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Inflow vs. outflow dynamics and net stock position
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Simplified Period Toggle: Monthly / Yearly */}
                    <div className="inline-flex rounded-md p-0.5 bg-gray-100 border border-gray-200 text-xs">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('monthly')}
                            className={`px-3 py-1 rounded font-semibold transition-all ${
                                currentFilter === 'monthly'
                                    ? 'bg-white text-red-950 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Last 6 Months
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('yearly')}
                            className={`px-3 py-1 rounded font-semibold transition-all ${
                                currentFilter === 'yearly'
                                    ? 'bg-white text-red-950 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Last 5 Years
                        </button>
                    </div>

                    <Link
                        href={route('compliance.analytics')}
                        className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-red-900 hover:text-red-950 hover:underline"
                    >
                        <span>Detailed Analytics</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Visual Movement Chart */}
            <div className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    {/* Custom Legend */}
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-500"></span>
                            <span className="text-gray-700">Stock Received</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-amber-500"></span>
                            <span className="text-gray-700">Items Issued (RIS)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-1 rounded-full bg-red-900"></span>
                            <span className="text-gray-700">Stock Balance Trend</span>
                        </div>
                    </div>

                    <div className="text-[11px] text-gray-400 font-medium">
                        Period: {currentFilter === 'yearly' ? 'Annual Consolidated' : 'Monthly Tracking'}
                    </div>
                </div>

                <InventoryMovementChart data={movement} />
            </div>

            {/* Concise Period Movement Summary Row */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center sm:text-left">
                <div className="sm:border-r sm:border-gray-100 sm:pr-4 pb-2 sm:pb-0 border-b sm:border-b-0 border-gray-50">
                    <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Total Received
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
                        +{receivedCount.toLocaleString()} <span className="text-xs font-sans text-gray-500 font-normal">units</span>
                    </span>
                </div>

                <div className="sm:border-r sm:border-gray-100 sm:pr-4">
                    <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Total Dispatched
                    </span>
                    <span className="text-lg font-bold font-mono text-amber-700 mt-0.5 block">
                        -{issuedCount.toLocaleString()} <span className="text-xs font-sans text-gray-500 font-normal">units</span>
                    </span>
                </div>

                <div>
                    <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Current Balance
                    </span>
                    <span className="text-lg font-bold font-mono text-gray-950 mt-0.5 block">
                        {endingBalance.toLocaleString()} <span className="text-xs font-sans text-gray-500 font-normal">units</span>
                    </span>
                </div>
            </div>

            {/* Mobile Link */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-right sm:hidden">
                <Link
                    href={route('compliance.analytics')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-900"
                >
                    <span>View Detailed Analytics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </section>
    );
}
