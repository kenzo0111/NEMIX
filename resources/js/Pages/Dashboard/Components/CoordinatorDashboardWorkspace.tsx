import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, ArrowUpRight, Boxes, Building2, CheckCircle2, ClipboardList, Clock3, PackageCheck, PackageSearch, Plus } from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import InventoryMovementOverview from './InventoryMovementOverview';
import RecentSystemActivity from './RecentSystemActivity';
import { panel, secondaryButton, displayDate } from '@/Pages/Inventory/Coordinator/inventory';
import { RequestStatusBadge } from '@/Pages/Inventory/Requests/components/RequestStatusBadge';
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

const nextStep: Record<CoordinatorRequest['status'], string> = {
    Pending: 'Awaiting Supply Office review',
    Approved: 'Supply Office is preparing release',
    Issued: 'Released to your unit inventory',
    Rejected: 'Review remarks in My Requests',
    Cancelled: 'Request closed',
};

export default function CoordinatorDashboardWorkspace({ auth, coordinatorName, summary, stats, movement = [], movementSummary, criticalStock = [], recentActivity = [], filters, requestSummary = {}, recentRequests = [] }: Props) {
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? criticalStock.length;
    const pending = requestSummary.Pending ?? 0;
    const approved = requestSummary.Approved ?? 0;
    const requestHref = route('inventory.requests.index');
    const inventoryHref = route('coordinator.inventory.index');
    const metrics = [
        { label: 'Needs replenishment', value: criticalCount, detail: 'Low or out-of-stock supply types', href: '#stock-attention', icon: PackageSearch, tone: criticalCount ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
        { label: 'Pending review', value: pending, detail: 'Requests with the Supply Office', href: route('inventory.requests.index', { status: 'Pending' }), icon: Clock3, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
        { label: 'Awaiting release', value: approved, detail: 'Approved requests being prepared', href: route('inventory.requests.index', { status: 'Approved' }), icon: PackageCheck, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
        { label: 'Issued this month', value: issuedMtd, detail: 'Quantity distributed to personnel', href: route('coordinator.inventory.index', { tab: 'history' }), icon: Boxes, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    ];

    return <>
        <DashboardHeader coordinator />
        <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-8">
            <section className="flex flex-wrap items-center justify-between gap-5">
                <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400"><Building2 size={14} aria-hidden="true" />{coordinatorName || auth.user.name} · Unit workspace</p>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your unit at a glance</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Keep supplies available and follow requests from review to release.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href={inventoryHref} className={secondaryButton}>Unit inventory<ArrowUpRight size={16} aria-hidden="true" /></Link>
                    <Link href={route('inventory.requests.index', { create: 1 })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"><Plus size={17} aria-hidden="true" />New Request</Link>
                </div>
            </section>

            <section aria-label="Unit summary" className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                {metrics.map(metric => {
                    const className = `${panel} group p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:p-5`;
                    const content = <>
                        <div className="flex items-center justify-between gap-2"><span className={`rounded-xl p-2.5 ${metric.tone}`}><metric.icon size={20} strokeWidth={1.7} aria-hidden="true" /></span><ArrowUpRight size={16} className="text-slate-400" aria-hidden="true" /></div>
                        <dl className="mt-4"><dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</dt><dd className="mt-1 text-3xl font-bold tabular-nums">{metric.value.toLocaleString()}</dd><dd className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{metric.detail}</dd></dl>
                    </>;
                    return metric.href.startsWith('#') ? <a key={metric.label} href={metric.href} className={className}>{content}</a> : <Link key={metric.label} href={metric.href} className={className}>{content}</Link>;
                })}
            </section>

            <section id="stock-attention" aria-labelledby="stock-attention-heading" className={`${panel} scroll-mt-36 overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5 dark:border-slate-800">
                    <div className="flex items-center gap-3"><span className={`rounded-xl p-2.5 ${criticalCount ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{criticalCount ? <AlertTriangle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}</span><div><h3 id="stock-attention-heading" className="text-base font-bold">Stock requiring attention <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">({criticalCount})</span></h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{criticalCount ? 'Review shortages and prepare your next supply request.' : 'Your tracked supplies are above their alert thresholds.'}</p></div></div>
                    <Link href={inventoryHref} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-red-900 dark:text-red-300">All inventory<ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
                {criticalStock.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{criticalStock.map((item, index) => {
                    const shortage = Math.max(0, item.min - item.current);
                    const urgent = item.current <= 0 || item.priority === 'Critical';
                    return <article key={item.id ?? index} className="flex flex-col gap-4 p-4 sm:px-5 lg:flex-row lg:items-center">
                        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{item.name}</h4><span className={`rounded-md px-2 py-1 text-xs font-semibold ${urgent ? 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>{item.status || (urgent ? 'Critical' : 'Low stock')}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.sku}</p></div>
                        <div className="min-w-0 lg:w-64"><p className="text-sm"><strong className="tabular-nums">{item.current} {item.unit}</strong><span className="text-slate-500 dark:text-slate-400"> available · Minimum {item.min}</span></p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true"><div className={`h-full rounded-full ${urgent ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${item.min > 0 ? Math.min(100, Math.max(0, item.current / item.min * 100)) : 0}%` }} /></div></div>
                        <p className={`text-xs font-semibold lg:w-36 ${urgent ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>{shortage > 0 ? `${shortage} ${item.unit} below minimum` : 'At reorder threshold'}</p>
                        <Link href={route('inventory.requests.index', { create: 1, ...(item.item_id ? { item_id: item.item_id } : {}) })} aria-label={`Request replenishment for ${item.name}`} className={`${secondaryButton} shrink-0 text-xs`}>Request replenishment<Plus size={14} aria-hidden="true" /></Link>
                    </article>;
                })}</div> : <div className="flex items-center gap-3 px-5 py-7 text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />No stock alerts. Continue monitoring your unit inventory.</div>}
                <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-400"><span>{availableItems} supply types in stock · {summary?.unserviceable ?? 0} out of stock</span><span>{criticalCount > criticalStock.length ? `Showing ${criticalStock.length} of ${criticalCount} alerts · View all in inventory` : 'Prioritized by lowest available quantity'}</span></div>
            </section>

            <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
                <section aria-labelledby="request-tracking-heading" className={`${panel} min-w-0 overflow-hidden`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5 dark:border-slate-800"><div><h3 id="request-tracking-heading" className="flex items-center gap-2 text-base font-bold"><ClipboardList size={18} className="text-slate-400" aria-hidden="true" />My request tracker</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open requests first, followed by your latest updates.</p></div><Link href={requestHref} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-red-900 dark:text-red-300">All requests<ArrowRight size={15} aria-hidden="true" /></Link></div>
                    {recentRequests.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{recentRequests.map(request => <Link key={request.id} href={route('inventory.requests.index', { request_id: request.id })} aria-label={`View ${request.reference}`} className="block space-y-2 p-5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 dark:hover:bg-slate-800/40"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{request.reference}</span><RequestStatusBadge status={request.status} /></div><p className="truncate text-sm text-slate-600 dark:text-slate-300" title={request.items}>{request.items || 'Supply request'}</p><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{nextStep[request.status]}</span><span>{displayDate(request.date)}</span></div></Link>)}</div> : <div className="px-5 py-9 text-center"><ClipboardList size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" /><p className="text-sm font-semibold">No supply requests yet</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create a request to start tracking its review and release.</p><Link href={route('coordinator.catalog.index')} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-300">Browse central catalog<ArrowRight size={15} aria-hidden="true" /></Link></div>}
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-400">Approved supplies enter your unit inventory when the Supply Office releases them.</div>
                </section>
                <RecentSystemActivity activities={recentActivity} />
            </div>

            <section aria-label="Inventory movement trends" className="min-w-0">
                <InventoryMovementOverview movement={movement} movementSummary={movementSummary} currentFilter={filters?.chartFilter} />
            </section>
        </div>
    </>;
}
