import { Button } from '@/Components/ui/button';
import StatusBadge from '@/Components/ui/status-badge';
import StatCard from '@/Components/ui/stat-card';
import EmptyState from '@/Components/ui/empty-state';
import TablePagination from '@/Components/ui/table-pagination';
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
            <Head title="Pre-Requests & Unit Demand | Supply Office" />

            <DashboardLayout
                modules={getSidebarModules('Inventory', 'Pre-Requests / Unit Demand')}
                user={auth.user}
            >
                <DashboardContent>
<PageHeader embedded
                    title="Pre-Requests & Unit Demand"
                    description="Monitor out-of-stock items needed by Delivery Units and Offices to prioritize purchase orders and warehouse replenishment."
                    breadcrumbs={[
                        { name: 'Dashboard', href: route('dashboard') },
                        { name: 'Inventory', href: route('inventory.index') },
                        { name: 'Pre-Requests / Unit Demand' },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="secondary"
                                type="button"
                                disabled={loading}
                                onClick={() => router.reload({ onStart: () => setLoading(true), onFinish: () => setLoading(false) })}
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
                                Refresh Demand
                            </Button>
                            <Link data-variant="primary" data-size="default"
                                href={route('inventory.receiving')}
                                className="ui-button"
                            >
                                <PackagePlus size={15} aria-hidden="true" />
                                Receive Stock
                            </Link>
                        </div>
                    }
                />
                    {/* Top Stats Cards */}
                    <section aria-label="Replenishment demand metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                        <StatCard
                            label="Units Demanded"
                            value={stats.total_units_demanded.toLocaleString('en-PH')}
                            sublabel="Total supply items requested across delivery units"
                            icon={<Package size={18} />}
                            tone="brand"
                        />
                        <StatCard
                            label="Items With Demand"
                            value={stats.items_with_demand}
                            sublabel="Out-of-stock supply types awaiting replenishment"
                            icon={<PackageX size={18} />}
                            tone="warning"
                        />
                        <StatCard
                            label="Urgent Demands"
                            value={stats.urgent_demands}
                            sublabel="Critical operational priority requests from offices"
                            icon={<Zap size={18} />}
                            tone="danger"
                        />
                        <StatCard
                            label="Active Pre-Requests"
                            value={stats.total_pending_orders}
                            sublabel="Pending pre-request tickets from coordinators"
                            icon={<Layers3 size={18} />}
                            tone="neutral"
                        />
                    </section>

                    {/* Main Workspace Surface */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                        {/* Tab Switcher */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 sm:px-6 dark:border-slate-800">
                            <div role="tablist" className="flex gap-4 sm:gap-6">
                                <Button variant="tab"
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'by_item'}
                                    onClick={() => { setTab('by_item'); load(search, status, urgency, 'by_item'); }}
                                    className="inline-flex min-h-13 items-center gap-2"
                                >
                                    <Boxes size={16} />
                                    <span>Demand by Item (Consolidated)</span>
                                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
                                        {consolidatedItems.length}
                                    </span>
                                </Button>
                                <Button variant="tab"
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === 'all_requests'}
                                    onClick={() => { setTab('all_requests'); load(search, status, urgency, 'all_requests'); }}
                                    className="inline-flex min-h-13 items-center gap-2"
                                >
                                    <FileText size={16} />
                                    <span>All Pre-Request Submissions</span>
                                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
                                        {detailedOrders.total}
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative flex-1">
                                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by item name, stock number, or delivery unit…"
                                    className="ui-field w-full rounded-lg border-slate-300 pl-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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

                                <Button variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex min-h-10 items-center justify-center gap-1.5"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    Search
                                </Button>
                            </div>
                        </form>

                        {/* TAB 1: Consolidated Demand by Item */}
                        {tab === 'by_item' && (
                            <div className="overflow-x-auto w-full min-w-0">
                                <table className="ui-data-table w-full text-left text-sm min-w-[60rem] border-collapse">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold tracking-normal text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 normal-case">
                                        <tr>
                                            <th className="px-5 py-3.5 whitespace-nowrap">Stock No.</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap min-w-[11.25rem]">Item Name</th>
                                            <th className="px-5 py-3.5 text-right whitespace-nowrap">In Warehouse</th>
                                            <th className="px-5 py-3.5 text-right whitespace-nowrap">Units Demanded</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap min-w-[12.5rem]">Requesting Delivery Units</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap">Priority</th>
                                            <th className="px-5 py-3.5 text-right whitespace-nowrap min-w-[10rem]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {consolidatedItems.length > 0 ? (
                                            consolidatedItems.map((item) => (
                                                <tr key={item.item_id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle font-mono font-medium text-slate-600 dark:text-slate-300">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle min-w-[11.25rem] max-w-md break-words">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.item_name}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                                            Unit of issue: {item.unit}
                                                        </p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right tabular-nums">
                                                        <StatusBadge tone="danger">
                                                            {item.on_hand} {item.unit} (Out of Stock)
                                                        </StatusBadge>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right tabular-nums">
                                                        <strong className="text-base font-semibold text-red-900 dark:text-red-300">
                                                            {item.total_quantity_demanded.toLocaleString('en-PH')}
                                                        </strong>{' '}
                                                        <span className="text-sm text-slate-500 dark:text-slate-300">{item.unit}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle max-w-md">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.waiting_units.map((unit, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium ${unit.urgency === 'urgent'
    ? "border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
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
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                                                        <StatusBadge tone={item.urgent_pre_orders_count > 0 ? 'danger' : 'neutral'}>
                                                            {item.urgent_pre_orders_count > 0 ? `${item.urgent_pre_orders_count} Urgent` : 'Normal'}
                                                        </StatusBadge>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right min-w-[10rem]">
                                                        <div className="inline-flex items-center justify-end gap-2 shrink-0">
                                                            <Link data-variant="secondary" data-size="sm"
                                                                href={route('inventory.receiving')}
                                                                className="ui-button"
                                                            >
                                                                <PackagePlus size={14} aria-hidden="true" />
                                                                Receive
                                                                <ArrowRight size={13} aria-hidden="true" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-0">
                                                    <EmptyState
                                                        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />}
                                                        title="No pending pre-requests matching your filters"
                                                        description="Delivery Units have not submitted any pre-requests for out-of-stock supplies."
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 2: All Pre-Order Submissions */}
                        {tab === 'all_requests' && (
                            <div className="overflow-x-auto w-full min-w-0">
                                <table className="ui-data-table w-full text-left text-sm min-w-[60rem] border-collapse">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold tracking-normal text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 normal-case">
                                        <tr>
                                            <th className="px-5 py-3.5 whitespace-nowrap align-middle">ID</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap min-w-[11.25rem] align-middle">Delivery Unit / Office</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap min-w-[11.25rem] align-middle">Item Demanded</th>
                                            <th className="px-5 py-3.5 text-right whitespace-nowrap align-middle">Qty Needed</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap align-middle">Priority</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap min-w-[12.5rem] align-middle">Purpose / Remarks</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap align-middle">Date Submitted</th>
                                            <th className="px-5 py-3.5 whitespace-nowrap align-middle">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {detailedOrders.data.length > 0 ? (
                                            detailedOrders.data.map((order) => (
                                                <tr key={order.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle font-mono text-sm text-slate-500 dark:text-slate-300">
                                                        #{order.id}
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle min-w-[11.25rem] break-words">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {order.delivery_unit}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            By {order.user_name} {order.user_designation ? `· ${order.user_designation}` : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle min-w-[11.25rem] max-w-xs break-words">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                                            {order.item_name}
                                                        </p>
                                                        <p className="font-mono text-sm text-slate-500 dark:text-slate-300">
                                                            {order.sku}
                                                        </p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right tabular-nums">
                                                        <strong className="text-sm font-semibold text-red-900 dark:text-red-300">
                                                            {order.quantity_requested.toLocaleString('en-PH')}
                                                        </strong>{' '}
                                                        <span className="text-sm text-slate-500 dark:text-slate-300">{order.unit}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                                                        <StatusBadge tone={order.urgency === 'urgent' ? 'danger' : 'neutral'}>
                                                            {order.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                                                        </StatusBadge>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle min-w-[12.5rem] max-w-sm text-sm text-slate-600 dark:text-slate-300 break-words">
                                                        {order.purpose || <span className="text-slate-500 italic dark:text-slate-300">None specified</span>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm tabular-nums text-slate-500 dark:text-slate-300">
                                                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                                                        <StatusBadge
                                                            tone={
                                                                order.status === 'pending'
                                                                    ? 'warning'
                                                                    : order.status === 'notified'
                                                                      ? 'info'
                                                                      : order.status === 'fulfilled'
                                                                        ? 'success'
                                                                        : 'neutral'
                                                            }
                                                        >
                                                            {order.status === 'pending' && 'Pending'}
                                                            {order.status === 'notified' && 'Stock Arrived / Notified'}
                                                            {order.status === 'fulfilled' && 'Fulfilled'}
                                                            {order.status === 'cancelled' && 'Cancelled'}
                                                        </StatusBadge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="p-0">
                                                    <EmptyState
                                                        title="No submissions found"
                                                        description="No pre-request submissions match the selected filters."
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {tab === 'all_requests' && detailedOrders.total > 0 && (() => {
                            const numericLinks = detailedOrders.links.filter((l) => /^\d+$/.test(l.label.trim()));
                            const activeLink = numericLinks.find((l) => l.active);
                            const currentPage = activeLink ? Number(activeLink.label) : 1;
                            const totalPages = numericLinks.length > 0 ? Number(numericLinks[numericLinks.length - 1].label) : 1;
                            const prevUrl = detailedOrders.links[0]?.url;
                            const nextUrl = detailedOrders.links[detailedOrders.links.length - 1]?.url;
                            return (
                                <TablePagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalRecords={detailedOrders.total}
                                    from={detailedOrders.from ?? 0}
                                    to={detailedOrders.to ?? 0}
                                    onPageChange={(nextPage) => {
                                        const url = nextPage < currentPage ? prevUrl : nextUrl;
                                        if (url) router.get(url, {}, { preserveScroll: true, preserveState: true });
                                    }}
                                    recordLabel="pre-requests"
                                />
                            );
                        })()}
                    </div>
                </DashboardContent>
            </DashboardLayout>
        </>
    );
}
