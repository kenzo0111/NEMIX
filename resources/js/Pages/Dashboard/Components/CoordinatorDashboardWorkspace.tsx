import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, Plus } from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import InventoryMovementOverview from './InventoryMovementOverview';
import CriticalStockOverview from './CriticalStockOverview';
import RecentSystemActivity from './RecentSystemActivity';
import { panel } from '@/Pages/Inventory/Coordinator/inventory';
import {
    CriticalStockItem,
    DashboardActivity,
    DashboardStats,
    DashboardSummary,
    MovementPoint,
    MovementSummary,
    RecentIssuance,
    RecentReceiving,
} from '../types';

interface CoordinatorDashboardWorkspaceProps {
    auth: { user: { id: number; name: string; email: string } };
    coordinatorName?: string;
    summary?: DashboardSummary;
    stats?: DashboardStats;
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    recentReceiving?: RecentReceiving[];
    recentIssuance?: RecentIssuance[];
    criticalStock?: CriticalStockItem[];
    recentActivity?: DashboardActivity[];
    filters?: {
        chartFilter?: string;
        customStartDate?: string;
        customEndDate?: string;
    };
    requestSummary?: Record<string, number>;
}

export default function CoordinatorDashboardWorkspace({
    auth,
    coordinatorName,
    summary,
    stats,
    movement = [],
    movementSummary,
    criticalStock = [],
    recentActivity = [],
    filters,
    requestSummary = {},
}: CoordinatorDashboardWorkspaceProps) {
    const [showMovement, setShowMovement] = useState(false);
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? criticalStock.length;
    const pendingRequests = requestSummary['Pending'] ?? 0;
    const approvedRequests = requestSummary['Approved'] ?? 0;

    const metrics = [
        {
            label: 'Supplies in stock',
            value: availableItems,
            detail: 'Available item types',
            href: route('coordinator.inventory.index'),
        },
        {
            label: 'Active requests',
            value: pendingRequests + approvedRequests,
            detail: `${pendingRequests} pending · ${approvedRequests} approved`,
            href: route('inventory.requests.index'),
        },
        {
            label: 'For replenishment',
            value: criticalCount,
            detail: criticalCount ? 'Low or out of stock' : 'Stock levels are healthy',
            href: '#stock-attention',
            attention: criticalCount > 0,
        },
        {
            label: 'Issued this month',
            value: issuedMtd,
            detail: 'Items distributed to personnel',
            href: route('coordinator.inventory.index', { tab: 'history' }),
        },
    ];

    return (
        <>
            <DashboardHeader coordinator />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="min-w-0 break-words text-sm text-slate-500 dark:text-slate-400">
                        {coordinatorName || auth.user.name}
                    </p>
                    <Link
                        href={route('inventory.requests.index', { create: 1 })}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                    >
                        <Plus size={17} aria-hidden="true" />
                        New Request
                    </Link>
                </div>

                <section aria-label="Unit summary" className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                    {metrics.map((metric) => {
                        const content = (
                            <>
                                <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</dt>
                                <dd className={`mt-2 text-3xl font-bold tabular-nums ${metric.attention ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {metric.value.toLocaleString()}
                                </dd>
                                <dd className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</dd>
                            </>
                        );
                        const className = `${panel} block min-w-0 p-4 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:p-5`;

                        return metric.href.startsWith('#') ? (
                            <a key={metric.label} href={metric.href} className={className}>
                                <dl>{content}</dl>
                            </a>
                        ) : (
                            <Link key={metric.label} href={metric.href} className={className}>
                                <dl>{content}</dl>
                            </Link>
                        );
                    })}
                </section>

                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
                    <section id="stock-attention" aria-label="Stock requiring attention" className="min-w-0 scroll-mt-52">
                        <CriticalStockOverview items={criticalStock} />
                    </section>
                    <section aria-label="Recent unit activity" className="min-w-0">
                        <RecentSystemActivity activities={recentActivity} className="h-full" />
                    </section>
                </div>

                <section aria-label="Inventory trends" className="space-y-4">
                    <button
                        type="button"
                        aria-expanded={showMovement}
                        aria-controls="coordinator-inventory-trends"
                        onClick={() => setShowMovement((visible) => !visible)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left text-sm font-semibold text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        Inventory movement trends
                        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${showMovement ? 'rotate-180' : ''}`} />
                    </button>
                    <div id="coordinator-inventory-trends" hidden={!showMovement}>
                        {showMovement && (
                            <InventoryMovementOverview
                                movement={movement}
                                movementSummary={movementSummary}
                                currentFilter={filters?.chartFilter}
                            />
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
