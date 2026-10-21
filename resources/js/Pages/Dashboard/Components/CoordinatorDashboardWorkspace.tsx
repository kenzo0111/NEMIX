import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    FileText,
    FileX,
    Package,
    PackageCheck,
    Plus,
    Search,
    TrendingUp,
    Wallet,
    XCircle,
} from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import InventoryMovementOverview from './InventoryMovementOverview';
import RecentReceiving from './RecentReceiving';
import RecentIssuance from './RecentIssuance';
import CriticalStockOverview from './CriticalStockOverview';
import RecentSystemActivity from './RecentSystemActivity';
import { money, panel, secondaryButton } from '@/Pages/Inventory/Coordinator/inventory';
import {
    CriticalStockItem,
    DashboardActivity,
    DashboardStats,
    DashboardSummary,
    MovementPoint,
    MovementSummary,
    RecentIssuance as RecentIssuanceType,
    RecentReceiving as RecentReceivingType,
} from '../types';

interface CoordinatorDashboardWorkspaceProps {
    auth: { user: { id: number; name: string; email: string } };
    coordinatorName?: string;
    summary?: DashboardSummary;
    stats?: DashboardStats;
    movement?: MovementPoint[];
    movementSummary?: MovementSummary;
    recentReceiving?: RecentReceivingType[];
    recentIssuance?: RecentIssuanceType[];
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
    recentReceiving = [],
    recentIssuance = [],
    criticalStock = [],
    recentActivity = [],
    filters,
    requestSummary = {},
}: CoordinatorDashboardWorkspaceProps) {
    const rawVal = summary?.total_inventory_value ?? 0;
    const availableItems = summary?.available_items ?? stats?.activeInventoryItems ?? 0;
    const issuedMtd = summary?.issued_this_month ?? stats?.itemsIssuedMtd ?? 0;
    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? criticalStock.length;

    const pendingRequests = requestSummary['Pending'] ?? 0;
    const approvedRequests = requestSummary['Approved'] ?? 0;
    const issuedRequests = requestSummary['Issued'] ?? 0;
    const rejectedRequests = requestSummary['Rejected'] ?? 0;
    const cancelledRequests = requestSummary['Cancelled'] ?? 0;
    const activeRequests = pendingRequests + approvedRequests;

    const pipelineStages = [
        {
            label: 'Pending Review',
            count: pendingRequests,
            hint: 'With Supply Office',
            icon: Clock3,
            color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
            href: route('inventory.requests.index'),
        },
        {
            label: 'Approved',
            count: approvedRequests,
            hint: 'Awaiting release',
            icon: PackageCheck,
            color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
            href: route('inventory.requests.index'),
        },
        {
            label: 'Released to Unit',
            count: issuedRequests,
            hint: 'In unit inventory',
            icon: CheckCircle2,
            color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
            href: route('inventory.requests.index'),
        },
        {
            label: 'Rejected',
            count: rejectedRequests,
            hint: 'Returned with remarks',
            icon: XCircle,
            color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
            href: route('inventory.requests.index'),
        },
        {
            label: 'Cancelled',
            count: cancelledRequests,
            hint: 'Withdrawn requisitions',
            icon: FileX,
            color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            href: route('inventory.requests.index'),
        },
    ];

    return (
        <>
            <DashboardHeader coordinator />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-8">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="text-slate-700 dark:text-slate-300">Coordinator Dashboard</span>
                </nav>

                {/* Hero Header Section */}
                <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                        <p className="leading-relaxed mb-2 text-sm font-bold normal-case tracking-normal text-red-900 dark:text-red-300">
                            Supply & Property Management Office
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight ">
                            Delivery Unit Dashboard
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Monitor your unit’s supplies, track requisitions, and review distributions.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <Link
                            href={route('inventory.requests.index', { create: 1 })}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                        >
                            <Plus size={17} />
                            New Request
                        </Link>
                        <Link href={route('inventory.requests.index')} className={secondaryButton}>
                            <ClipboardList size={16} />
                            My Requests
                        </Link>
                        <Link href={route('coordinator.inventory.index')} className={secondaryButton}>
                            <Boxes size={16} />
                            Unit Inventory
                        </Link>
                        <Link href={route('coordinator.catalog.index')} className={secondaryButton}>
                            <Search size={16} />
                            Central Stock
                        </Link>
                    </div>
                </section>

                {/* Unit Inventory & Requests Overview Cards */}
                <section aria-label="Delivery Unit operational summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                    {/* Supplies in Stock */}
                    <Link
                        href={route('coordinator.inventory.index')}
                        className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800`}
                    >
                        <div className="min-w-0">
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Supplies in stock</p>
                            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
                                {availableItems}
                                <span className="ml-2 text-sm font-normal text-slate-500">item types</span>
                            </p>
                            <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Available in your Delivery Unit
                            </p>
                        </div>
                        <span className="hidden rounded-xl bg-red-50 p-2.5 text-red-900 xl:inline-flex dark:bg-red-950/60 dark:text-red-300">
                            <Boxes size={20} />
                        </span>
                    </Link>

                    {/* Inventory Value */}
                    <Link
                        href={route('coordinator.inventory.index')}
                        className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800`}
                    >
                        <div className="min-w-0">
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Inventory value</p>
                            <p className="mt-2 break-words text-lg font-bold tracking-tight tabular-nums sm:text-2xl">
                                {money(rawVal)}
                            </p>
                            <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Total value of supplies on hand
                            </p>
                        </div>
                        <span className="hidden rounded-xl bg-slate-100 p-2.5 text-slate-600 xl:inline-flex dark:bg-slate-800 dark:text-slate-300">
                            <Wallet size={20} />
                        </span>
                    </Link>

                    {/* For Replenishment */}
                    <Link
                        href={route('coordinator.inventory.index')}
                        className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800`}
                    >
                        <div className="min-w-0">
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">For replenishment</p>
                            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
                                {criticalCount}
                                <span className="ml-2 text-sm font-normal text-slate-500">item types</span>
                            </p>
                            <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {criticalCount ? 'Low or out of stock · request supplies' : 'No items currently need replenishment'}
                            </p>
                        </div>
                        <span
                            className={`hidden rounded-xl p-2.5 xl:inline-flex ${
                                criticalCount
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                        >
                            <Package size={20} />
                        </span>
                    </Link>

                    {/* Issued This Month */}
                    <Link
                        href={route('coordinator.inventory.index', { tab: 'history' })}
                        className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800`}
                    >
                        <div className="min-w-0">
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Issued this month</p>
                            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
                                {issuedMtd}
                                <span className="ml-2 text-sm font-normal text-slate-500">items</span>
                            </p>
                            <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Distributed to unit personnel MTD
                            </p>
                        </div>
                        <span className="hidden rounded-xl bg-blue-50 p-2.5 text-blue-700 xl:inline-flex dark:bg-blue-950/40 dark:text-blue-300">
                            <TrendingUp size={20} />
                        </span>
                    </Link>

                    {/* Active Requisitions */}
                    <Link
                        href={route('inventory.requests.index')}
                        className={`${panel} col-span-2 flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 xl:col-span-1`}
                    >
                        <div className="min-w-0">
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Active requisitions</p>
                            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
                                {activeRequests}
                                <span className="ml-2 text-sm font-normal text-slate-500">requests</span>
                            </p>
                            <p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {pendingRequests} pending · {approvedRequests} approved
                            </p>
                        </div>
                        <span className="rounded-xl bg-purple-50 p-2.5 text-purple-700 xl:inline-flex dark:bg-purple-950/40 dark:text-purple-300">
                            <ClipboardList size={20} />
                        </span>
                    </Link>
                </section>

                {/* Workflow Guidance Strip */}
                <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-sm text-red-950 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                    <p className="leading-relaxed">
                        Supplies enter your unit inventory when released by the Supply Office. Record distributions to faculty and staff here.
                    </p>
                    <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                        <span>Submit request</span>
                        <ArrowRight size={13} className="opacity-50" />
                        <span>Supply Office review</span>
                        <ArrowRight size={13} className="opacity-50" />
                        <span>Release to unit</span>
                        <ArrowRight size={13} className="opacity-50" />
                        <span>Distribute</span>
                    </div>
                </div>

                {/* Requisitions Pipeline Section */}
                <section className={`${panel} overflow-hidden`} aria-label="Supply requisitions pipeline">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:px-6 sm:py-5 sm:flex-row sm:items-center dark:border-slate-800">
                        <div>
                            <h2 className="text-lg font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
                                {coordinatorName ? `${coordinatorName} · ` : ''}Requisitions Pipeline
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Follow each requisition from review to release by the central Supply Office.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link href={route('inventory.requests.index')} className={`${secondaryButton} min-h-9 px-3 text-sm`}>
                                <ClipboardList size={15} />
                                All My Requests
                            </Link>
                            <Link
                                href={route('inventory.requests.index', { create: 1 })}
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-red-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800"
                            >
                                <Plus size={15} />
                                New Request
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 sm:p-6">
                        {pipelineStages.map((stage) => (
                            <Link
                                key={stage.label}
                                href={stage.href}
                                className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 transition hover:border-slate-400 hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        {stage.label}
                                    </span>
                                    <span className={`rounded-lg p-1.5 ${stage.color}`}>
                                        <stage.icon size={16} />
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                        {stage.count}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                        {stage.hint}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 text-sm text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
                        <span>Approved supplies enter your unit inventory when the Supply Office releases them.</span>
                        <div className="flex flex-wrap items-center gap-4 font-semibold text-red-900 dark:text-red-300">
                            <Link href={route('coordinator.catalog.index')} className="hover:underline inline-flex items-center gap-1">
                                Browse Central Stock <ArrowRight size={13} />
                            </Link>
                            <Link href={route('coordinator.inventory.index')} className="hover:underline inline-flex items-center gap-1">
                                Manage Unit Stock & Stock Cards <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Dominant Visualization & Recent Operations */}
                <section aria-label="Operational Activity and Stock Attention" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                            <InventoryMovementOverview
                                movement={movement}
                                movementSummary={movementSummary}
                                currentFilter={filters?.chartFilter}
                            />
                        </div>

                        <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <RecentReceiving receivings={recentReceiving} />
                            <RecentIssuance issuances={recentIssuance} />
                        </div>
                    </div>

                    <div>
                        <CriticalStockOverview items={criticalStock} />
                    </div>
                </section>

                {/* Recent Unit Activity Feed */}
                <section aria-label="Recent System Activity">
                    <RecentSystemActivity activities={recentActivity} />
                </section>

                {/* Portal Footer */}
                <footer className="flex flex-wrap justify-between gap-2 pb-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Delivery Unit workspace · {coordinatorName || auth.user.name}</span>
                    <span>Need more supplies? Submit a request to the Supply Office.</span>
                </footer>
            </div>
        </>
    );
}
