import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import DashboardContent from '@/Layouts/DashboardContent';
import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, Boxes, Building2, ChartColumn, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, FileText, Layers3, Package, Plus, TriangleAlert } from 'lucide-react';
import InventoryMovementChart from '../Charts/InventoryMovementChart';
import RecentSystemActivity from './RecentSystemActivity';
import { displayDate, secondaryButton } from '@/Pages/Inventory/Coordinator/inventory';
import type { CentralReceivingSummary as CentralReceivingSummaryType, CoordinatorRequest, CriticalStockItem, DashboardActivity, DashboardStats, DashboardSummary, MovementPoint, MovementSummary } from '../types';
import useAuthorization from '@/Hooks/useAuthorization';
import { COORDINATOR_TOUR_START_EVENT } from './CoordinatorWalkthroughGuide';
import CentralReceivingSummary from './CentralReceivingSummary';
import CoordinatorStockAttention from './CoordinatorStockAttention';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';

const chartPeriodOptions = [
    { value: 'monthly', label: 'Last 6 months' },
    { value: 'yearly', label: 'Last 5 years' },
    { value: 'custom', label: 'Custom period' },
];

interface Props {
    auth: {
        user: { id: number; name: string; email: string };
        capabilities?: { requiresSupportingDocument?: boolean };
    };
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
    centralReceivingSummary?: CentralReceivingSummaryType;
}

const surface = 'min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700/70 dark:bg-slate-900';
const quietLink = 'inline-flex min-h-10 items-center gap-1 rounded text-sm font-semibold text-red-900 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-red-300 dark:hover:text-red-200';

export default function CoordinatorDashboardWorkspace({
    auth, coordinatorName, summary, stats, movement = [], criticalStock = [],
    recentActivity = [], filters, requestSummary = {}, recentRequests = [], centralReceivingSummary,
}: Props) {
    const { can } = useAuthorization();
    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const inventoryHref = route('coordinator.inventory.index');
    const historyHref = route('coordinator.inventory.index', { tab: 'history' });
    const requestHref = route('inventory.requests.index');
    const catalogHref = route('coordinator.catalog.index');
    const pending = (requestSummary.Pending ?? 0) + (requestSummary['Pending Verification'] ?? 0) + (requestSummary['Under Review'] ?? 0);
    const correction = requestSummary['For Correction'] ?? 0;
    const approved = (requestSummary.Approved ?? 0) + (requestSummary['Ready for Pickup'] ?? 0);
    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? criticalStock.length;
    const metrics = [
        { label: 'Active requests', value: pending + correction + approved, detail: `${pending} pending · ${correction} need correction · ${approved} awaiting release`, href: can('inventory.requests.index') ? requestHref : '', icon: FileText, tone: 'border-red-200 bg-red-50/50 dark:border-red-800/70 dark:bg-red-950/20', iconTone: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
        { label: 'For replenishment', value: criticalCount, detail: 'Supply types at or below minimum', href: '#stock-attention', icon: TriangleAlert, tone: 'border-amber-200 bg-amber-50/50 dark:border-amber-700/60 dark:bg-amber-950/20', iconTone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
        { label: 'Items in stock', value: summary?.total_inventory ?? 0, detail: 'Total quantity across units of measure', href: can('coordinator.inventory.index') ? inventoryHref : '', icon: Package, tone: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/70 dark:bg-emerald-950/20', iconTone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
        { label: 'Item types', value: summary?.available_items ?? stats?.activeInventoryItems ?? 0, detail: 'Available supply types', href: can('coordinator.inventory.index') ? inventoryHref : '', icon: Layers3, tone: 'border-blue-200 bg-blue-50/50 dark:border-blue-800/70 dark:bg-blue-950/20', iconTone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    ];
    const monthlyMetrics = [
        { label: 'Received this month', value: summary?.received_this_month ?? 0, detail: 'Quantity received from Supply Office', icon: ArrowDownToLine },
        { label: 'Issued this month', value: summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0, detail: 'Quantity distributed to personnel', icon: ArrowUpFromLine },
        { label: 'Stock movements', value: summary?.movements_this_month ?? 0, detail: 'Receipt and issue entries this month', icon: ChartColumn },
    ];
    const quickLinks = [
        can('coordinator.inventory.stock-card') && { label: isAuthorizedPersonnel ? 'Office stock cards' : 'Unit stock cards', href: inventoryHref, icon: ClipboardList, tone: 'text-emerald-700 dark:text-emerald-300' },
        can('coordinator.catalog.index') && { label: 'Supply catalog', href: catalogHref, icon: BookOpen, tone: 'text-blue-700 dark:text-blue-300' },
        can('inventory.requests.index') && { label: 'My requests', href: requestHref, icon: FileText, tone: 'text-red-800 dark:text-red-300' },
        can('coordinator.inventory.index') && { label: 'Stock movements', href: historyHref, icon: Activity, tone: 'text-violet-700 dark:text-violet-300' },
    ].filter(Boolean) as { label: string; href: string; icon: React.ComponentType<any>; tone: string }[];

    return (
        <>
            <DashboardContent>
                <PageHeader embedded title={isAuthorizedPersonnel ? "Office overview" : "Delivery unit overview"} description="Review your supplies, requests, and stock movements." />
                <section data-tour="coordinator-dashboard-header" aria-label={isAuthorizedPersonnel ? 'Office workspace' : 'Unit workspace'} className={`${surface} flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-red-50/60 to-white p-4 dark:from-red-950/20 dark:to-slate-900`}>
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-100/60 text-red-900 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300"><Building2 size={25} strokeWidth={1.6} aria-hidden="true" /></span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">{isAuthorizedPersonnel ? 'Office workspace' : 'Unit workspace'}</p>
                            <h2 className="mt-1 break-words text-base font-semibold">{coordinatorName || auth.user.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{isAuthorizedPersonnel ? 'Office' : 'Delivery Unit'}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" type="button" onClick={() => window.dispatchEvent(new Event(COORDINATOR_TOUR_START_EVENT))} className={`${secondaryButton} `}><CircleHelp size={17} aria-hidden="true" />Walkthrough Guide</Button>
                        {can('inventory.requests.store') && <Link data-variant="primary" data-size="default" href={route('inventory.requests.index', { create: 1 })} className="ui-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"><Plus size={17} aria-hidden="true" />New Request</Link>}
                        {can('inventory.requests.index') && <Link data-variant="secondary" data-size="default" href={route('inventory.requests.index', { status: 'Approved' })} className={"ui-button " + (`${secondaryButton} text-sm`)}><Boxes size={17} aria-hidden="true" />Awaiting release</Link>}
                        {can('coordinator.inventory.issue') && <Link data-variant="secondary" data-size="default" href={inventoryHref} className={"ui-button " + (`${secondaryButton} text-sm`)}><ArrowUpFromLine size={17} aria-hidden="true" />Issue supplies</Link>}
                        {can('coordinator.catalog.index') && <Link data-variant="secondary" data-size="default" href={catalogHref} className={"ui-button " + (`${secondaryButton} text-sm`)}><BookOpen size={17} aria-hidden="true" />View catalog</Link>}
                    </div>
                </section>

                <section data-tour="coordinator-dashboard-summary" aria-label={isAuthorizedPersonnel ? 'Office summary' : 'Unit summary'} className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 xl:grid-cols-4">
                    {metrics.map(metric => {
                        const className = `group flex min-w-0 items-start gap-3 rounded-xl border p-4 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:hover:brightness-110 ${metric.tone}`;
                        const content = <>
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${metric.iconTone}`}><metric.icon size={23} strokeWidth={1.7} aria-hidden="true" /></span>
                            <dl className="min-w-0 flex-1"><dt className="text-sm font-medium">{metric.label}</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{metric.value.toLocaleString('en-PH')}</dd><dd className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{metric.detail}</dd></dl>
                            <ChevronRight size={16} aria-hidden="true" className="mt-8 shrink-0 text-slate-500 dark:text-slate-300" />
                        </>;
                        return metric.href.startsWith('#') ? <a key={metric.label} href={metric.href} className={className}>{content}</a> : metric.href ? <Link key={metric.label} href={metric.href} className={className}>{content}</Link> : <div key={metric.label} className={className}>{content}</div>;
                    })}
                </section>
                <section aria-label="Monthly movement summary" className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {monthlyMetrics.map(metric => {
                        const content = <>
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><metric.icon size={23} strokeWidth={1.7} aria-hidden="true" /></span>
                            <dl className="min-w-0 flex-1"><dt className="text-sm text-slate-600 dark:text-slate-300">{metric.label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{metric.value.toLocaleString('en-PH')}</dd><dd className="mt-1 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</dd></dl>
                            <ChevronRight size={16} aria-hidden="true" className="mt-7 shrink-0 text-slate-500 dark:text-slate-300" />
                        </>;
                        const className = `${surface} flex items-start gap-3 p-4 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800`;
                        return can('coordinator.inventory.index') ? <Link key={metric.label} href={historyHref} className={className}>{content}</Link> : <div key={metric.label} className={className}>{content}</div>;
                    })}
                </section>

                {centralReceivingSummary && (
                    <CentralReceivingSummary
                        summary={centralReceivingSummary}
                        canViewCatalog={can('coordinator.catalog.index')}
                    />
                )}

                <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-4">
                        <section data-tour="coordinator-stock-alerts" id="stock-attention" aria-labelledby="stock-attention-heading" className={`${surface} scroll-mt-40 border-t-2 border-t-amber-500`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                                <h3 id="stock-attention-heading" className="flex items-center gap-2 text-base font-semibold"><TriangleAlert size={20} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />Stock requiring attention</h3>
                                {can('coordinator.inventory.index') && <Link href={inventoryHref} className={quietLink}>View all<ArrowRight size={13} aria-hidden="true" /></Link>}
                            </div>
                            {criticalStock.length ? (
                                <CoordinatorStockAttention items={criticalStock} canRequest={can('inventory.requests.store')} />
                            ) : <p className="flex items-center gap-2 px-4 py-8 text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 size={18} aria-hidden="true" />No stock alerts right now.</p>}
                            {criticalCount > Math.min(criticalStock.length, 4) && <p className="border-t border-slate-100 px-4 py-2 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">Showing {Math.min(criticalStock.length, 4)} of {criticalCount} alerts. View all in inventory.</p>}
                        </section>

                        <section aria-labelledby="movement-heading" className={`${surface} p-4`}>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <h3 id="movement-heading" className="flex items-center gap-2 text-base font-semibold"><ChartColumn size={20} className="text-slate-500 dark:text-slate-300" aria-hidden="true" />Inventory movement trends</h3>
                                <div className="w-44">
                                    <Select
                                        aria-label="Movement chart period"
                                        value={chartPeriodOptions.find(opt => opt.value === (filters?.chartFilter || 'monthly')) || chartPeriodOptions[0]}
                                        onChange={opt => router.get(route('dashboard'), { chart_filter: opt?.value || 'monthly' }, { preserveState: true, preserveScroll: true, replace: true })}
                                        options={filters?.chartFilter === 'custom' ? chartPeriodOptions : chartPeriodOptions.filter(o => o.value !== 'custom')}
                                        styles={institutionalSelectStyles}
                                        classNamePrefix="react-select"
                                        isSearchable={false}
                                    />
                                </div>
                            </div>
                            <InventoryMovementChart data={movement} />
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-4 text-sm text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Received</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-500" />Issued</span><span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-red-800 dark:bg-red-400" />Balance</span></div>
                        </section>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <RecentSystemActivity activities={recentActivity} />
                        <section aria-labelledby="quick-links-heading" className={`${surface} p-4`}>
                            <h3 id="quick-links-heading" className="mb-3 text-sm font-semibold">Quick links</h3>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                                {quickLinks.map(link => <Link key={link.label} href={link.href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-center text-sm font-medium transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:bg-slate-800/40"><link.icon size={23} className={link.tone} strokeWidth={1.7} aria-hidden="true" />{link.label}</Link>)}
                            </div>
                        </section>
                        {can('inventory.requests.index') && recentRequests.length > 0 && <details className={`${surface} px-4`}><summary className="cursor-pointer py-4 text-sm font-medium">Request updates</summary><div className="divide-y divide-slate-100 pb-2 dark:divide-slate-800">{recentRequests.slice(0, 3).map(request => <Link key={request.id} href={route('inventory.requests.index', { request_id: request.id })} className="block rounded py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{request.reference}</span><span className="text-slate-500 dark:text-slate-400">{request.status === 'Approved' ? 'Awaiting release' : request.status}</span></div><p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{request.items} · {displayDate(request.date)}</p></Link>)}</div></details>}
                    </div>
                </div>
            </DashboardContent>
        </>
    );
}
