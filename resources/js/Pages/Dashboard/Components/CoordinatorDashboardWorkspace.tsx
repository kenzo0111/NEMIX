import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Boxes, Building2, ChartNoAxesCombined, ChevronDown, ClipboardList, PackageCheck, PackageSearch, Plus } from 'lucide-react';
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
            icon: Boxes,
        },
        {
            label: 'Active requests',
            value: pendingRequests + approvedRequests,
            detail: `${pendingRequests} pending · ${approvedRequests} approved`,
            href: route('inventory.requests.index'),
            icon: ClipboardList,
        },
        {
            label: 'For replenishment',
            value: criticalCount,
            detail: criticalCount ? 'Low or out of stock' : 'Stock levels are healthy',
            href: '#stock-attention',
            attention: criticalCount > 0,
            icon: PackageSearch,
        },
        {
            label: 'Issued this month',
            value: issuedMtd,
            detail: 'Items distributed to personnel',
            href: route('coordinator.inventory.index', { tab: 'history' }),
            icon: PackageCheck,
        },
    ];

    return (
        <>
            <DashboardHeader coordinator />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-red-50/70 via-white to-white p-4 sm:p-5 dark:border-slate-800 dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-900 sm:inline-flex dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300">
                            <Building2 size={21} strokeWidth={1.7} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Unit workspace</p>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {coordinatorName || auth.user.name}
                            </p>
                        </div>
                    </div>
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
                                <dt className="flex items-start justify-between gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>{metric.label}</span>
                                    <span className={`inline-flex shrink-0 rounded-lg p-2 ${metric.attention ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <metric.icon size={18} strokeWidth={1.7} aria-hidden="true" />
                                    </span>
                                </dt>
                                <dd className={`mt-2 text-3xl font-bold tabular-nums ${metric.attention ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {metric.value.toLocaleString()}
                                </dd>
                                <dd className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <span>{metric.detail}</span>
                                    <ArrowUpRight size={14} aria-hidden="true" className="shrink-0 text-slate-400 transition-colors group-hover:text-red-900 dark:group-hover:text-red-300" />
                                </dd>
                            </>
                        );
                        const className = `${panel} group block min-w-0 border-t-2 ${metric.attention ? 'border-t-amber-400 dark:border-t-amber-600' : 'border-t-red-900/60 dark:border-t-red-800'} p-4 transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:p-5`;

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
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        <span className="flex items-center gap-3">
                            <ChartNoAxesCombined size={19} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-slate-400" />
                            <span>Inventory movement trends<span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">{showMovement ? 'Hide chart' : 'Expand to view stock movement'}</span></span>
                        </span>
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
