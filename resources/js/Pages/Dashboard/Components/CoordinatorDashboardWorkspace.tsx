import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import InventoryMovementOverview from './InventoryMovementOverview';
import RecentSystemActivity from './RecentSystemActivity';
import { displayDate } from '@/Pages/Inventory/Coordinator/inventory';
import { CoordinatorRequest, CriticalStockItem, DashboardActivity, DashboardStats, DashboardSummary, MovementPoint, MovementSummary } from '../types';

interface Props {
    auth: { user: { id: number; name: string; email: string } };
    coordinatorName?: string;
    summary?: DashboardSummary;
    stats?: DashboardStats;
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    criticalStock?: CriticalStockItem[];
    recentActivity?: DashboardActivity[];
    filters?: { chartFilter?: string; customStartDate?: string; customEndDate?: string };
    requestSummary?: Record<string, number>;
    recentRequests?: CoordinatorRequest[];
}

const requestStatus: Record<CoordinatorRequest['status'], string> = {
    Pending: 'Pending review',
    Approved: 'Awaiting release',
    Issued: 'Released',
    Rejected: 'Rejected',
    Cancelled: 'Cancelled',
};

const textLink = 'inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 transition hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-slate-400 dark:hover:text-red-300';

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
    recentRequests = [],
}: Props) {
    const [showMovement, setShowMovement] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? criticalStock.length;
    const pending = requestSummary.Pending ?? 0;
    const approved = requestSummary.Approved ?? 0;
    const inventoryHref = route('coordinator.inventory.index');
    const requestHref = route('inventory.requests.index');
    const metrics = [
        { label: 'Supply types in stock', value: availableItems, href: inventoryHref },
        { label: 'Open requests', value: pending + approved, href: requestHref },
        { label: 'Issued this month', value: issuedMtd, href: route('coordinator.inventory.index', { tab: 'history' }) },
    ];

    return (
        <>
            <DashboardHeader coordinator />
            <div className="mx-auto max-w-[1440px] space-y-7 p-4 sm:p-6 lg:p-8">
                <section className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Unit overview</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {coordinatorName || auth.user.name}
                        </p>
                    </div>
                    <Link
                        href={route('inventory.requests.index', { create: 1 })}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                    >
                        <Plus size={16} aria-hidden="true" />
                        New Request
                    </Link>
                </section>

                <section aria-label="Unit summary" className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
                        {metrics.map(metric => (
                            <Link
                                key={metric.label}
                                href={metric.href}
                                className="px-5 py-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 sm:px-6 dark:hover:bg-slate-800/40"
                            >
                                <dl className="flex items-center justify-between gap-3 sm:block">
                                    <dt className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</dt>
                                    <dd className="text-2xl font-semibold tabular-nums sm:mt-1.5">{metric.value.toLocaleString()}</dd>
                                </dl>
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-slate-100 px-5 py-2.5 text-xs leading-relaxed text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
                        <a href="#stock-attention" className={`inline-flex min-h-8 items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 ${criticalCount ? 'text-amber-800 dark:text-amber-300' : ''}`}>
                            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${criticalCount ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {criticalCount ? `${criticalCount} supply ${criticalCount === 1 ? 'type needs' : 'types need'} attention` : 'No stock alerts'}
                        </a>
                        <span className="flex flex-wrap gap-x-4">
                            <Link href={route('inventory.requests.index', { status: 'Pending' })} className="rounded py-1.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">{pending} pending review</Link>
                            <Link href={route('inventory.requests.index', { status: 'Approved' })} className="rounded py-1.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">{approved} awaiting release</Link>
                        </span>
                    </div>
                </section>

                <div className="grid min-w-0 grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
                    <section id="stock-attention" aria-labelledby="stock-attention-heading" className="min-w-0 scroll-mt-40 p-5 sm:p-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3">
                            <h3 id="stock-attention-heading" className="text-base font-semibold">Stock attention</h3>
                            <Link href={inventoryHref} className={textLink}>View inventory<ArrowRight size={14} aria-hidden="true" /></Link>
                        </div>
                        {criticalStock.length ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {criticalStock.slice(0, 3).map((item, index) => {
                                    const shortage = Math.max(0, item.min - item.current);
                                    const urgent = item.current <= 0 || item.priority === 'Critical';
                                    return (
                                        <article key={item.id ?? index} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4">
                                            <div className="min-w-0 flex-1 basis-48">
                                                <h4 className="break-words text-sm font-medium">{item.name}</h4>
                                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                                    <span className="tabular-nums">{item.current} {item.unit}</span> available · Minimum {item.min}
                                                </p>
                                                <p className={`mt-1 text-xs ${urgent ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                                                    {item.current <= 0 ? 'Out of stock' : shortage > 0 ? `${shortage} ${item.unit} below minimum` : 'At reorder threshold'}
                                                </p>
                                            </div>
                                            <Link
                                                href={route('inventory.requests.index', { create: 1, ...(item.item_id ? { item_id: item.item_id } : {}) })}
                                                aria-label={`Request replenishment for ${item.name}`}
                                                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Request<Plus size={13} aria-hidden="true" />
                                            </Link>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-start gap-2.5 py-6 text-sm text-slate-500 dark:text-slate-400">
                                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                                <p>No supplies need replenishment right now.</p>
                            </div>
                        )}
                        {criticalCount > Math.min(criticalStock.length, 3) && (
                            <Link href={inventoryHref} className={`${textLink} mt-2 text-xs`}>
                                View all {criticalCount} stock alerts<ArrowRight size={13} aria-hidden="true" />
                            </Link>
                        )}
                    </section>

                    <section aria-labelledby="request-tracking-heading" className="min-w-0 border-t border-slate-100 p-5 sm:p-6 lg:border-l lg:border-t-0 dark:border-slate-800">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3">
                            <h3 id="request-tracking-heading" className="text-base font-semibold">My requests</h3>
                            <Link href={requestHref} className={textLink}>View all<ArrowRight size={14} aria-hidden="true" /></Link>
                        </div>
                        {recentRequests.length ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentRequests.slice(0, 3).map(request => (
                                    <Link
                                        key={request.id}
                                        href={route('inventory.requests.index', { request_id: request.id })}
                                        aria-label={`View ${request.reference}`}
                                        className="block rounded-md py-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:hover:bg-slate-800/40"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                            <span className="break-words text-sm font-medium">{request.reference}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{requestStatus[request.status]}</span>
                                        </div>
                                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400" title={request.items}>{request.items || 'Supply request'}</p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{displayDate(request.date)}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-sm text-slate-500 dark:text-slate-400">
                                <p>No supply requests yet.</p>
                                <Link href={route('coordinator.catalog.index')} className={`${textLink} mt-2`}>Browse central catalog<ArrowRight size={14} aria-hidden="true" /></Link>
                            </div>
                        )}
                    </section>
                </div>

                <section aria-label="More unit information" className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    <div>
                        <button
                            type="button"
                            aria-expanded={showMovement}
                            aria-controls="coordinator-movement"
                            onClick={() => setShowMovement(visible => !visible)}
                            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md py-4 text-left text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-slate-400"
                        >
                            Inventory movement
                            <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${showMovement ? 'rotate-180' : ''}`} />
                        </button>
                        <div id="coordinator-movement" hidden={!showMovement} className="pb-5">
                            {showMovement && <InventoryMovementOverview movement={movement} movementSummary={movementSummary} currentFilter={filters?.chartFilter} />}
                        </div>
                    </div>
                    <div>
                        <button
                            type="button"
                            aria-expanded={showActivity}
                            aria-controls="coordinator-activity"
                            onClick={() => setShowActivity(visible => !visible)}
                            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md py-4 text-left text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-slate-400"
                        >
                            Recent activity
                            <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${showActivity ? 'rotate-180' : ''}`} />
                        </button>
                        <div id="coordinator-activity" hidden={!showActivity} className="pb-5">
                            {showActivity && <RecentSystemActivity activities={recentActivity} />}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
