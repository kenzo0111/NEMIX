import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { formatDisplayDate } from '@/utils/dateUtils';
import { RisPreviewModal } from '../Issuance/components/RisPreviewModal';
import { IssuanceRecord } from '../Issuance/types';
import { getFundClusterDisplay } from '../Issuance/constants';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { RequestFormModal } from './components/RequestFormModal';
import { RequestStatusBadge } from './components/RequestStatusBadge';
import { ReceivingStatusNotice } from '../Receiving/components/ReceivingStatusNotice';
import { DivisionGroup, RequestItem, SupplyRequest } from './types';
import { Plus, Search } from 'lucide-react';

const PAGE_SIZE = 10;
const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending Review' },
    { value: 'Approved', label: 'Approved · Awaiting Release' },
    { value: 'Issued', label: 'Issued · Released' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function MyRequests({
    auth,
    requests = [],
    items = [],
    divisions = [],
    defaultApprovedBy: propApprovedBy,
    defaultApprovedByDesignation: propApprovedByDesignation,
    defaultIssuedBy: propIssuedBy,
    defaultIssuedByDesignation: propIssuedByDesignation,
}: {
    auth: { user: { id: number; name: string; email: string } };
    requests: SupplyRequest[];
    items: RequestItem[];
    divisions?: DivisionGroup[];
    defaultApprovedBy?: string;
    defaultApprovedByDesignation?: string;
    defaultIssuedBy?: string;
    defaultIssuedByDesignation?: string;
}) {
    const [collapsed, toggle] = useSidebarCollapse();
    const pageProps = usePage().props as any;
    const systemSettings = (pageProps.systemSettings || {}) as Record<string, any>;
    const publicSettings = pageProps.system?.settings || {};

    const defaultApprovedBy =
        propApprovedBy ||
        systemSettings?.approved_by_name ||
        ((publicSettings['signatories_ris_oic_active']
            ? publicSettings['signatories_ris_oic_prefix'] || 'OIC, '
            : '') +
        (publicSettings['approved_by_name'] ||
            publicSettings['signatories_ris_approved_by_name'] ||
            publicSettings['signatories.ris_approved_by_name'] ||
            'ARSENIO GEM A. GARCILLANOSA'));

    const defaultApprovedByDesignation =
        propApprovedByDesignation ||
        systemSettings?.approved_by_designation ||
        systemSettings?.approved_by_position ||
        publicSettings['approved_by_position'] ||
        publicSettings['signatories_ris_approved_by_designation'] ||
        publicSettings['signatories.ris_approved_by_designation'] ||
        'SUPPLY OFFICER III/ADMIN OFFICER V';

    const defaultIssuedBy =
        propIssuedBy ||
        systemSettings?.issued_by_name ||
        publicSettings['issued_by_name'] ||
        publicSettings['signatories_ris_issued_by_name'] ||
        publicSettings['signatories.ris_issued_by_name'] ||
        'Supply Custodian / Storekeeper';

    const defaultIssuedByDesignation =
        propIssuedByDesignation ||
        systemSettings?.issued_by_position ||
        systemSettings?.issued_by_designation ||
        publicSettings['issued_by_position'] ||
        publicSettings['signatories_ris_issued_by_designation'] ||
        publicSettings['signatories.ris_issued_by_designation'] ||
        'Administrative Aide VI / Storekeeper';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<SupplyRequest | null>(null);
    const [detailsRequest, setDetailsRequest] = useState<SupplyRequest | null>(null);
    const [preview, setPreview] = useState<IssuanceRecord | null>(null);
    const [previewRequestId, setPreviewRequestId] = useState<number | null>(null);
    const [busy, setBusy] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const flash = pageProps.flash || {};
        if (flash.error) setNotification({ type: 'error', message: flash.error });
        else if (flash.success) setNotification({ type: 'success', message: flash.success });
    }, [pageProps.flash?.success, pageProps.flash?.error]);

    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 5000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    // Summary counts
    const counts = useMemo(() => {
        return {
            total: requests.length,
            pending: requests.filter((r) => r.status === 'Pending').length,
            approved: requests.filter((r) => r.status === 'Approved').length,
            issued: requests.filter((r) => r.status === 'Issued').length,
            rejectedOrCancelled: requests.filter((r) => ['Rejected', 'Cancelled'].includes(r.status)).length,
        };
    }, [requests]);

    const filtered = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return requests.filter((request) => {
            if (statusFilter && request.status !== statusFilter) return false;
            if (!query) return true;
            return [
                String(request.id),
                request.ris_number || '',
                request.recipient || '',
                request.recipient_designation || '',
                request.department,
                request.purpose,
                ...request.items.map((line) => line.item?.name || ''),
                ...request.items.map((line) => line.item?.sku || ''),
            ].some((value) => value.toLowerCase().includes(query));
        });
    }, [requests, searchTerm, statusFilter]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, lastPage);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to = Math.min(safePage * PAGE_SIZE, filtered.length);

    const openCreate = () => {
        setEditingRequest(null);
        setFormOpen(true);
    };

    const openEdit = (request: SupplyRequest) => {
        setEditingRequest(request);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingRequest(null);
    };

    const cancel = (request: SupplyRequest) => {
        if (!window.confirm(`Are you sure you want to cancel supply request #${request.id}?`)) return;
        setBusy(request.id);
        router.post(
            route('inventory.requests.cancel', request.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setNotification({ type: 'success', message: 'Supply request cancelled.' }),
                onError: (errors) => setNotification({ type: 'error', message: Object.values(errors).join(' ') }),
                onFinish: () => setBusy(null),
            }
        );
    };

    const openRis = (request: SupplyRequest) => {
        const issued = request.status === 'Issued';
        const recipientDesignation = request.recipient_designation || request.issuance?.recipient_designation || '';
        const lines = request.items
            .filter((line) => (line.approved_quantity ?? 0) > 0)
            .map((line) => {
                const issuanceItem = request.issuance?.items?.find((i: any) => i.item_id === line.item_id);
                const allocatedStockNos = issuanceItem?.allocations
                    ?.map((a: any) => a.inventory_batch?.supplier_stock_no || a.supplier_stock_no)
                    ?.filter(Boolean);
                const stockNoFromAllocations = allocatedStockNos && allocatedStockNos.length > 0
                    ? Array.from(new Set(allocatedStockNos)).join(', ')
                    : undefined;

                const stockNo = stockNoFromAllocations || line.item?.stock_no || line.item?.supplier_stock_no || '-';

                return {
                    id: line.id,
                    item_id: line.item_id,
                    item: line.item?.name || '',
                    sku: line.item?.sku || '',
                    quantity: line.approved_quantity || line.quantity,
                    unit: line.item?.unit_of_issue || 'pcs',
                    stock_no: stockNo,
                    unit_cost: line.item?.unit_cost || 0,
                    amount: (line.approved_quantity || line.quantity) * (line.item?.unit_cost || 0),
                    allocations: issuanceItem?.allocations || [],
                };
            });

        setPreview({
            id: request.id,
            ris_number: request.ris_number || '',
            recipient: request.recipient || auth.user.name,
            recipient_designation: recipientDesignation,
            department: request.department,
            purpose: request.purpose,
            fund_cluster: request.fund_cluster || '01',
            status: issued ? 'Issued' : 'Approved',
            requested_at: (request.date_requested || request.created_at)?.slice(0, 10),
            reviewed_at: request.reviewed_at?.slice(0, 10),
            date_issued: issued ? request.issuance?.date_issued || '' : '',
            date: '',
            approved_by: defaultApprovedBy,
            approved_by_designation: defaultApprovedByDesignation,
            issued_by: '',
            issued_by_name: issued ? (request.issuance?.issued_by_name || defaultIssuedBy) : defaultIssuedBy,
            issued_by_position: issued ? (request.issuance?.issued_by_position || defaultIssuedByDesignation) : defaultIssuedByDesignation,
            total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
            total_amount: lines.reduce((sum, line) => sum + line.amount, 0),
            items: lines,
        });
        setPreviewRequestId(request.id);
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 flex font-sans text-gray-900 dark:text-slate-100 overflow-x-hidden selection:bg-red-900 selection:text-white">
            <Head title="Inventory - My Requests" />
            <Sidebar
                modules={getSidebarModules('Inventory', 'My Requests')}
                user={auth.user}
                collapsed={collapsed}
                onToggleCollapse={toggle}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                <PageHeader
                    title="Inventory Management"
                    description="Supply requests, requisition tracking, and approval history"
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'My Requests' }]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16 min-w-0 space-y-5">
                    {/* Flash Notification Banner */}
                    <ReceivingStatusNotice
                        notification={notification}
                        onDismiss={() => setNotification(null)}
                    />

                    {/* Operational Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white dark:bg-slate-900 px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                                Total Submissions
                            </span>
                            <div className="mt-1.5 flex items-baseline justify-between">
                                <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                                    {counts.total}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                                    requisitions
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 px-4 py-3 sm:py-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs flex flex-col justify-between">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                                Pending Custodian Review
                            </span>
                            <div className="mt-1.5 flex items-baseline justify-between">
                                <span className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                                    {counts.pending}
                                </span>
                                <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-sans">
                                    awaiting
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 px-4 py-3 sm:py-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs flex flex-col justify-between">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 font-mono">
                                Approved · Ready for Release
                            </span>
                            <div className="mt-1.5 flex items-baseline justify-between">
                                <span className="text-2xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">
                                    {counts.approved}
                                </span>
                                <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-sans">
                                    for pickup
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 px-4 py-3 sm:py-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs flex flex-col justify-between">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                                Completed Issuances
                            </span>
                            <div className="mt-1.5 flex items-baseline justify-between">
                                <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                                    {counts.issued}
                                </span>
                                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-sans">
                                    released
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Requisitions Table Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight">
                                    My Supply Requests
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    Track submitted supply requisitions, custodian review remarks, final approved quantities, and RIS vouchers.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <label htmlFor="request-search-input" className="sr-only">
                                        Search my requests
                                    </label>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="request-search-input"
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Search by RIS, recipient, item..."
                                        className="w-full h-10 pl-9 pr-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs sm:text-sm font-medium focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                </div>

                                <div className="w-full sm:w-52">
                                    <Select
                                        value={statusOptions.find((option) => option.value === statusFilter) || statusOptions[0]}
                                        onChange={(option) => {
                                            setStatusFilter(option?.value || '');
                                            setCurrentPage(1);
                                        }}
                                        options={statusOptions}
                                        placeholder="Status"
                                        styles={institutionalSelectStyles}
                                        classNamePrefix="react-select"
                                        aria-label="Filter requests by status"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="w-full sm:w-auto h-10 px-4 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-semibold text-xs tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono cursor-pointer transition-colors shrink-0"
                                >
                                    <Plus className="w-4 h-4 text-amber-300" />
                                    New Request
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto min-w-0">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        {[
                                            'RIS No.',
                                            'Recipient & Department',
                                            'Fund Cluster / Purpose',
                                            'Items',
                                            'Date Requested',
                                            'Approval Status',
                                            'Actions',
                                        ].map((label) => (
                                            <th
                                                key={label}
                                                className={`px-4 lg:px-5 py-3 text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase font-mono ${
                                                    label === 'Actions' ? 'text-right' : ''
                                                }`}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                    {visible.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-2" />
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                                        No supply requests found
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                                        {searchTerm || statusFilter
                                                            ? 'Try adjusting your search criteria or status filter.'
                                                            : 'Submit a new supply requisition to begin tracking approval from the Property Custodian.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visible.map((request) => {
                                            const totalRequestedQty = request.items.reduce((sum, line) => sum + line.quantity, 0);
                                            const totalApprovedQty = request.items.reduce(
                                                (sum, line) => sum + (line.approved_quantity ?? 0),
                                                0
                                            );
                                            const isReviewed = ['Approved', 'Issued'].includes(request.status);
                                            const hasQuantityAdjustment =
                                                isReviewed &&
                                                request.items.some(
                                                    (line) => line.approved_quantity !== null && line.approved_quantity !== line.quantity
                                                );

                                            return (
                                                <tr
                                                    key={request.id}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                                                >
                                                    {/* RIS No. */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 tracking-tight">
                                                                {request.ris_number || `RIS-${String(request.id).padStart(4, '0')}`}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-normal">
                                                                Req #{request.id}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Recipient & Department */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top">
                                                        <div className="flex flex-col min-w-0 max-w-xs sm:max-w-sm">
                                                            <span
                                                                className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug truncate"
                                                                title={request.recipient || request.requester?.name || 'Supply Coordinator'}
                                                            >
                                                                {request.recipient || request.requester?.name || 'Supply Coordinator'}
                                                            </span>
                                                            <span
                                                                className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-snug line-clamp-2 mt-0.5"
                                                                title={request.department}
                                                            >
                                                                {request.department}
                                                            </span>
                                                            {request.recipient_designation && (
                                                                <span
                                                                    className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 truncate"
                                                                    title={request.recipient_designation}
                                                                >
                                                                    {request.recipient_designation}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Fund Cluster / Purpose */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top">
                                                        <div className="flex flex-col min-w-0 max-w-xs">
                                                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                                {(getFundClusterDisplay(request.fund_cluster) || '01 · Regular Agency Fund').replace(' - ', ' · ')}
                                                            </span>
                                                            <span
                                                                className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 mt-0.5"
                                                                title={request.purpose}
                                                            >
                                                                {request.purpose}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Items */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top">
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                                                    {request.items.length} {request.items.length === 1 ? 'item' : 'items'}
                                                                </span>
                                                                {hasQuantityAdjustment && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 leading-none">
                                                                        Adjusted
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isReviewed ? (
                                                                <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1">
                                                                    <span className="text-slate-500 dark:text-slate-400">
                                                                        {totalRequestedQty} requested
                                                                    </span>
                                                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        {totalApprovedQty} approved
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                                                    <span>{totalRequestedQty} requested</span>
                                                                    {request.items[0]?.item?.name && (
                                                                        <span className="block truncate max-w-[180px] font-sans text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                                            {request.items[0].item.name}
                                                                            {request.items.length > 1 && ` +${request.items.length - 1} more`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Date Requested */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                                                        {formatDisplayDate(request.date_requested || request.created_at, 'MM/DD/YYYY') ||
                                                            request.date_requested ||
                                                            request.created_at}
                                                    </td>

                                                    {/* Approval Status */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top whitespace-nowrap">
                                                        <RequestStatusBadge status={request.status} />
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 lg:px-5 py-3.5 align-top whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setDetailsRequest(request)}
                                                                className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                                                            >
                                                                View
                                                            </button>

                                                            {request.status === 'Pending' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(request)}
                                                                    className="text-red-950 dark:text-red-400 font-semibold text-xs py-1 px-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}

                                                            {isReviewed && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openRis(request)}
                                                                    className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                                                                >
                                                                    View RIS
                                                                </button>
                                                            )}

                                                            {['Pending', 'Approved'].includes(request.status) && (
                                                                <button
                                                                    type="button"
                                                                    disabled={busy === request.id}
                                                                    onClick={() => cancel(request)}
                                                                    className="text-gray-400 hover:text-rose-700 dark:hover:text-rose-400 font-semibold text-xs py-1 px-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                                                                    title="Cancel Request"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filtered.length > 0 && (
                            <div className="px-4 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                    Showing <strong className="text-slate-700 dark:text-slate-200">{from}</strong>–<strong className="text-slate-700 dark:text-slate-200">{to}</strong> of <strong className="text-slate-700 dark:text-slate-200">{filtered.length}</strong> records
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                                        disabled={safePage <= 1}
                                        aria-label="Go to previous page"
                                        className="h-8 px-3 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-1 text-slate-500 dark:text-slate-400">
                                        Page <strong className="text-slate-700 dark:text-slate-200">{safePage}</strong> of <strong className="text-slate-700 dark:text-slate-200">{lastPage}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(Math.min(lastPage, safePage + 1))}
                                        disabled={safePage >= lastPage}
                                        aria-label="Go to next page"
                                        className="h-8 px-3 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Request Creation / Editing Modal */}
            <RequestFormModal
                show={formOpen}
                request={editingRequest}
                items={items}
                divisions={divisions}
                defaultRecipient={auth.user.name}
                defaultApprovedBy={defaultApprovedBy}
                defaultApprovedByDesignation={defaultApprovedByDesignation}
                defaultIssuedBy={defaultIssuedBy}
                defaultIssuedByDesignation={defaultIssuedByDesignation}
                onClose={closeForm}
                onSaved={(message) => setNotification({ type: 'success', message })}
            />

            {/* Request Details Modal */}
            <RequestDetailsModal
                show={!!detailsRequest}
                request={detailsRequest}
                defaultApprovedBy={defaultApprovedBy}
                defaultApprovedByDesignation={defaultApprovedByDesignation}
                defaultIssuedBy={defaultIssuedBy}
                defaultIssuedByDesignation={defaultIssuedByDesignation}
                onClose={() => setDetailsRequest(null)}
                onOpenRis={(req) => {
                    setDetailsRequest(null);
                    openRis(req);
                }}
            />

            {/* RIS Preview & Print Modal */}
            <RisPreviewModal
                show={!!preview}
                issuance={preview}
                onClose={() => {
                    setPreview(null);
                    setPreviewRequestId(null);
                }}
                downloadUrl={previewRequestId ? route('inventory.requests.ris-pdf', previewRequestId) : undefined}
                institutionName={pageProps.systemSettings?.entity_name || 'University of Camarines Norte'}
                responsibilityCenterCode={pageProps.system?.settings?.institution_responsibility_center_code || ''}
                defaultApprovedBy={defaultApprovedBy}
                defaultApprovedByDesignation={defaultApprovedByDesignation}
                defaultIssuedBy={defaultIssuedBy}
                defaultIssuedByDesignation={defaultIssuedByDesignation}
            />
        </div>
    );
}
