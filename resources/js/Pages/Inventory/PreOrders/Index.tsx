import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
    AlertTriangle, 
    ArrowRight, 
    Boxes, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Filter, 
    Layers3, 
    Loader2, 
    Package, 
    PackagePlus, 
    PackageX, 
    RefreshCw, 
    Search, 
    TrendingUp, 
    Zap 
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardContent from '@/Layouts/DashboardContent';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';

declare function route(name: string, params?: any): string;

interface WaitingUnit {
    delivery_unit: string;
    quantity: number;
    urgency: 'normal' | 'urgent';
}

interface ConsolidatedItem {
    item_id: number;
    item_name: string;
    sku: string;
    on_hand: number;
    unit: string;
    item_status: string;
    total_pre_orders: number;
    total_quantity_demanded: number;
    urgent_pre_orders_count: number;
    earliest_demand_at: string;
    latest_demand_at: string;
    waiting_units: WaitingUnit[];
}

interface DetailedOrder {
    id: number;
    item_id: number;
    item_name: string;
    sku: string;
    unit: string;
    stock_on_hand: number;
    item_status: string;
    user_name: string;
    user_designation: string;
    delivery_unit: string;
    quantity_requested: number;
    urgency: 'normal' | 'urgent';
    purpose: string | null;
    status: 'pending' | 'notified' | 'fulfilled' | 'cancelled';
    created_at: string;
    notified_at: string | null;
    fulfilled_at: string | null;
}

interface Props {
    stats: {
        total_pending_orders: number;
        total_units_demanded: number;
        items_with_demand: number;
        urgent_demands: number;
    };
    consolidatedItems: ConsolidatedItem[];
    detailedOrders: {
        data: DetailedOrder[];
        from: number | null;
        to: number | null;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
        status: string;
        urgency: string;
        tab: 'by_item' | 'all_requests';
    };
}

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Replenishment' },
    { value: 'notified', label: 'Restocked / Notified' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
];

const urgencyOptions = [
    { value: 'all', label: 'All Urgencies' },
    { value: 'urgent', label: 'Urgent Priority Only' },
    { value: 'normal', label: 'Normal Replenishment' },
];

export default function PreOrdersIndex({
    stats,
    consolidatedItems,
    detailedOrders,
    filters,
}: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'pending');
    const [urgency, setUrgency] = useState(filters.urgency || 'all');
    const [tab, setTab] = useState<'by_item' | 'all_requests'>(filters.tab || 'by_item');
    const [loading, setLoading] = useState(false);

    const load = (newSearch = search, newStatus = status, newUrgency = urgency, newTab = tab) => {
        router.get(
            route('inventory.pre-orders.index'),
            {
                search: newSearch.trim(),
                status: newStatus,
                urgency: newUrgency,
                tab: newTab,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        load(search, status, urgency, tab);
    };

    return (
        <>
            <Head title="Pre-Orders & Unit Demand | Supply Office" />

            <DashboardLayout
                modules={getSidebarModules('Inventory', 'Pre-Orders / Unit Demand')}
                user={auth.user}
            >
                <PageHeader
                    title="Pre-Orders & Unit Demand"
                    description="Monitor out-of-stock items needed by Delivery Units and Offices to prioritize purchase orders and warehouse replenishment."
                    breadcrumbs={[
                        { name: 'Dashboard', href: route('dashboard') },
                        { name: 'Inventory', href: route('inventory.index') },
                        { name: 'Pre-Orders / Unit Demand' },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => router.reload({ onStart: () => setLoading(true), onFinish: () => setLoading(false) })}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-2xs"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                Refresh Demand
                            </button>
                            <Link
                                href={route('inventory.receiving')}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 transition shadow-2xs"
                            >
                                <PackagePlus size={15} />
                                Receive Stock
                            </Link>
                        </div>
                    }
                />

                <DashboardContent>
                    {/* Top Stats Cards */}
                    <section aria-label="Replenishment demand metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-5 dark:border-red-900/60 dark:bg-red-950/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-300">
                                    Units Demanded
                                </p>
                                <span className="rounded-lg bg-red-100 p-2 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                                    <Package size={18} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {stats.total_units_demanded.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Total supply items requested across delivery units
                            </p>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                    Items With Demand
                                </p>
                                <span className="rounded-lg bg-amber-100 p-2 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    <PackageX size={18} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {stats.items_with_demand}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Out-of-stock supply types awaiting replenishment
                            </p>
                        </div>

                        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
                                    Urgent Demands
                                </p>
                                <span className="rounded-lg bg-rose-100 p-2 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                                    <Zap size={18} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {stats.urgent_demands}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Critical operational priority requests from offices
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Active Pre-Orders
                                </p>
                                <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    <Layers3 size={18} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {stats.total_pending_orders}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Pending pre-order tickets from coordinators
                            </p>
                        </div>
                    </section>

                    {/* Main Workspace Surface */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                        {/* Tab Switcher */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 sm:px-6 dark:border-slate-800">
                            <div role="tablist" className="flex gap-4 sm:gap-6">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'by_item'}
                                    onClick={() => { setTab('by_item'); load(search, status, urgency, 'by_item'); }}
                                    className={`inline-flex min-h-13 items-center gap-2 border-b-2 py-3.5 text-sm font-semibold transition ${
                                        tab === 'by_item'
                                            ? 'border-red-900 text-red-900 dark:border-red-400 dark:text-red-300'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Boxes size={16} />
                                    <span>Demand by Item (Consolidated)</span>
                                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
                                        {consolidatedItems.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'all_requests'}
                                    onClick={() => { setTab('all_requests'); load(search, status, urgency, 'all_requests'); }}
                                    className={`inline-flex min-h-13 items-center gap-2 border-b-2 py-3.5 text-sm font-semibold transition ${
                                        tab === 'all_requests'
                                            ? 'border-red-900 text-red-900 dark:border-red-400 dark:text-red-300'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <FileText size={16} />
                                    <span>All Pre-Order Submissions</span>
                                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
                                        {detailedOrders.total}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative flex-1">
                                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by item name, stock number, or delivery unit…"
                                    className="w-full rounded-lg border-slate-300 pl-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="w-full sm:w-48">
                                    <Select
                                        value={statusOptions.find((opt) => opt.value === status) || statusOptions[1]}
                                        onChange={(opt) => {
                                            const next = opt?.value || 'all';
                                            setStatus(next);
                                            load(search, next, urgency, tab);
                                        }}
                                        options={statusOptions}
                                        styles={institutionalSelectStyles}
                                        classNamePrefix="react-select"
                                        isSearchable={false}
                                        aria-label="Filter status"
                                    />
                                </div>

                                <div className="w-full sm:w-48">
                                    <Select
                                        value={urgencyOptions.find((opt) => opt.value === urgency) || urgencyOptions[0]}
                                        onChange={(opt) => {
                                            const next = opt?.value || 'all';
                                            setUrgency(next);
                                            load(search, status, next, tab);
                                        }}
                                        options={urgencyOptions}
                                        styles={institutionalSelectStyles}
                                        classNamePrefix="react-select"
                                        isSearchable={false}
                                        aria-label="Filter urgency"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 transition shadow-2xs"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    Search
                                </button>
                            </div>
                        </form>

                        {/* TAB 1: Consolidated Demand by Item */}
                        {tab === 'by_item' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3.5">Stock No.</th>
                                            <th className="px-5 py-3.5">Item Name</th>
                                            <th className="px-5 py-3.5 text-right">In Warehouse</th>
                                            <th className="px-5 py-3.5 text-right">Units Demanded</th>
                                            <th className="px-5 py-3.5">Requesting Delivery Units</th>
                                            <th className="px-5 py-3.5">Priority</th>
                                            <th className="px-5 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {consolidatedItems.length > 0 ? (
                                            consolidatedItems.map((item) => (
                                                <tr key={item.item_id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                    <td className="whitespace-nowrap px-5 py-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-5 py-4 max-w-sm">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.item_name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            Unit of issue: {item.unit}
                                                        </p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">
                                                        <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                                            {item.on_hand} {item.unit} (Out of Stock)
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">
                                                        <strong className="text-base font-bold text-red-900 dark:text-red-300">
                                                            {item.total_quantity_demanded.toLocaleString()}
                                                        </strong>{' '}
                                                        <span className="text-xs text-slate-500">{item.unit}</span>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-md">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.waiting_units.map((unit, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                                                                        unit.urgency === 'urgent'
                                                                            ? 'border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                                            : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    <span>{unit.delivery_unit}</span>
                                                                    <strong className="font-semibold">({unit.quantity})</strong>
                                                                    {unit.urgency === 'urgent' && (
                                                                        <Zap size={11} className="text-amber-600 dark:text-amber-400" />
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        {item.urgent_pre_orders_count > 0 ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                                <Zap size={12} />
                                                                {item.urgent_pre_orders_count} Urgent
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-right">
                                                        <Link
                                                            href={route('inventory.receiving')}
                                                            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 transition"
                                                        >
                                                            <PackagePlus size={13} />
                                                            Receive
                                                            <ArrowRight size={12} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-600" />
                                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                                        No pending pre-orders matching your filters
                                                    </p>
                                                    <p className="mt-1 text-xs">
                                                        Delivery Units have not submitted any pre-orders for out-of-stock supplies.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 2: All Pre-Order Submissions */}
                        {tab === 'all_requests' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3.5">ID</th>
                                            <th className="px-5 py-3.5">Delivery Unit / Office</th>
                                            <th className="px-5 py-3.5">Item Demanded</th>
                                            <th className="px-5 py-3.5 text-right">Qty Needed</th>
                                            <th className="px-5 py-3.5">Priority</th>
                                            <th className="px-5 py-3.5">Purpose / Remarks</th>
                                            <th className="px-5 py-3.5">Date Submitted</th>
                                            <th className="px-5 py-3.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {detailedOrders.data.length > 0 ? (
                                            detailedOrders.data.map((order) => (
                                                <tr key={order.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                                                        #{order.id}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {order.delivery_unit}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            By {order.user_name} {order.user_designation ? `· ${order.user_designation}` : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-xs">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                                            {order.item_name}
                                                        </p>
                                                        <p className="font-mono text-xs text-slate-500">
                                                            {order.sku}
                                                        </p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">
                                                        <strong className="text-sm font-bold text-red-900 dark:text-red-300">
                                                            {order.quantity_requested.toLocaleString()}
                                                        </strong>{' '}
                                                        <span className="text-xs text-slate-500">{order.unit}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        {order.urgency === 'urgent' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                                <Zap size={11} /> Urgent
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 max-w-sm text-xs text-slate-600 dark:text-slate-300">
                                                        {order.purpose || <span className="text-slate-400 italic">None specified</span>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums text-slate-500">
                                                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                                                            order.status === 'pending'
                                                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                                                : order.status === 'notified'
                                                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                                                                : order.status === 'fulfilled'
                                                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {order.status === 'pending' && 'Pending'}
                                                            {order.status === 'notified' && 'Stock Arrived / Notified'}
                                                            {order.status === 'fulfilled' && 'Fulfilled'}
                                                            {order.status === 'cancelled' && 'Cancelled'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    No submissions found matching the selected filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {tab === 'all_requests' && detailedOrders.total > 15 && (
                            <nav aria-label="Pre-order pagination" className="flex flex-wrap justify-center gap-1.5 border-t border-slate-100 p-4 dark:border-slate-800">
                                {detailedOrders.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            aria-current={link.active ? 'page' : undefined}
                                            className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-medium ${
                                                link.active
                                                    ? 'bg-red-900 text-white'
                                                    : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="inline-flex min-h-9 items-center px-3 text-xs text-slate-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                )}
                            </nav>
                        )}
                    </div>
                </DashboardContent>
            </DashboardLayout>
        </>
    );
}
