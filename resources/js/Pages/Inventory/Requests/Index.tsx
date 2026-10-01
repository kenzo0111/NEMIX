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
import { RequestStatusBadge, ItemQuantityDisplay } from './components/RequestStatusBadge';
import { DivisionGroup, RequestItem, SupplyRequest } from './types';
import { Plus, Search, FileText, Eye, Edit3, XCircle } from 'lucide-react';

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
    defaultApprovedBy = 'ARSENIO GEM A. GARCILLANOSA',
    defaultApprovedByDesignation = 'SUPPLY OFFICER III/ADMIN OFFICER V',
    defaultIssuedBy = 'Supply Custodian / Storekeeper',
    defaultIssuedByDesignation = 'Administrative Aide VI / Storekeeper',
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
        const lines = request.items
            .filter((line) => (line.approved_quantity ?? 0) > 0)
            .map((line) => ({
                id: line.id,
                item_id: line.item_id,
                item: line.item?.name || '',
                sku: line.item?.sku || '',
                quantity: line.approved_quantity || line.quantity,
                unit: line.item?.unit_of_issue || 'pcs',
                stock_no: '-',
                unit_cost: line.item?.unit_cost || 0,
                amount: (line.approved_quantity || line.quantity) * (line.item?.unit_cost || 0),
                allocations: [],
            }));

        setPreview({
            id: request.id,
            ris_number: request.ris_number || '',
            recipient: request.recipient || auth.user.name,
            department: request.department,
            purpose: request.purpose,
            fund_cluster: request.fund_cluster || '01',
            status: issued ? 'Issued' : 'Approved',
            requested_at: (request.date_requested || request.created_at)?.slice(0, 10),
            reviewed_at: request.reviewed_at?.slice(0, 10),
            date_issued: issued ? request.issuance?.date_issued || '' : '',
            date: '',
            approved_by: request.reviewer?.name || defaultApprovedBy,
            approved_by_designation: defaultApprovedByDesignation,
            issued_by: '',
            issued_by_name: issued ? request.issuance?.issued_by_name || defaultIssuedBy : '',
            issued_by_position: issued ? request.issuance?.issued_by_position || defaultIssuedByDesignation : '',
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

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16 min-w-0 space-y-6">
                    {/* Notification Toast */}
                    {notification && (
                        <div
                            role="status"
                            className={`px-4 py-3 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-xs ${
                                notification.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                            }`}
                        >
                            <span>{notification.message}</span>
                            <button
                                type="button"
                                onClick={() => setNotification(null)}
                                aria-label="Dismiss notification"
                                className="ml-3 text-lg leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Operational Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-2xs">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                Total Submissions
                            </span>
                            <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-2xl font-black font-mono text-gray-900 dark:text-slate-100">
                                    {counts.total}
                                </span>
                                <span className="text-xs text-gray-500 font-sans">requisitions</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                                Pending Custodian Review
                            </span>
                            <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                                    {counts.pending}
                                </span>
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-sans">awaiting</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/50 shadow-2xs">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 font-mono">
                                Approved · Ready for Release
                            </span>
                            <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400">
                                    {counts.approved}
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-sans">for pickup</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                                Completed Issuances
                            </span>
                            <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                                    {counts.issued}
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans">released</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Requisitions Table Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight">
                                    My Supply Requests
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                                    Track submitted supply requisitions, custodian review remarks, final approved quantities, and RIS vouchers.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <label htmlFor="request-search-input" className="sr-only">
                                        Search my requests
                                    </label>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
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
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-md text-xs font-medium focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-xs placeholder-gray-400 dark:placeholder-slate-500"
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
                                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer min-h-[38px] transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-amber-300" />
                                    New Request
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto min-w-0">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800">
                                    <tr>
                                        {[
                                            'Request / RIS No.',
                                            'Recipient & Department',
                                            'Fund Cluster / Purpose',
                                            'Items (Requested vs Final)',
                                            'Date Requested',
                                            'Approval Status',
                                            'Actions',
                                        ].map((label) => (
                                            <th
                                                key={label}
                                                className={`px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono ${
                                                    label === 'Actions' ? 'text-right' : ''
                                                }`}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                    {visible.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-2" />
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">
                                                        No supply requests found
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
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
                                                    className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0"
                                                >
                                                    {/* Request / RIS No. */}
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-slate-100 font-mono tracking-wide">
                                                        <div className="flex flex-col">
                                                            <span>
                                                                {request.ris_number || `REQ-${String(request.id).padStart(4, '0')}`}
                                                            </span>
                                                            {request.ris_number && (
                                                                <span className="text-[10px] text-gray-400 font-normal">
                                                                    ID #{request.id}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Recipient & Office/Department */}
                                                    <td className="px-4 lg:px-6 py-4 text-xs">
                                                        <div className="font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                                            {request.recipient || request.requester?.name || 'Supply Coordinator'}
                                                        </div>
                                                        <div className="text-[11px] text-gray-600 dark:text-slate-400 font-medium mt-0.5">
                                                            {request.department}
                                                        </div>
                                                        {request.recipient_designation && (
                                                            <div className="text-[10px] text-gray-400 italic">
                                                                {request.recipient_designation}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Fund Cluster / Purpose */}
                                                    <td className="px-4 lg:px-6 py-4 text-xs">
                                                        <div className="font-mono text-[11px] text-gray-600 dark:text-slate-400">
                                                            {getFundClusterDisplay(request.fund_cluster) || '01 - Regular Agency Fund'}
                                                        </div>
                                                        <div
                                                            className="text-gray-800 dark:text-slate-200 mt-0.5 max-w-xs truncate"
                                                            title={request.purpose}
                                                        >
                                                            {request.purpose}
                                                        </div>
                                                    </td>

                                                    {/* Items (Requested vs Final) */}
                                                    <td className="px-4 lg:px-6 py-4 text-xs">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-gray-900 dark:text-slate-100">
                                                                    {request.items.length}{' '}
                                                                    {request.items.length === 1 ? 'item' : 'items'}
                                                                </span>
                                                                <span className="text-gray-400 text-[11px]">
                                                                    ({totalRequestedQty} requested)
                                                                </span>
                                                            </div>

                                                            {isReviewed ? (
                                                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                                                        Final: {totalApprovedQty} units approved
                                                                    </span>
                                                                    {hasQuantityAdjustment && (
                                                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                                            Adjusted
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-xs">
                                                                    {request.items[0]?.item?.name || 'Item'}
                                                                    {request.items.length > 1 && ` +${request.items.length - 1} more`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Date Requested */}
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-slate-400 font-mono">
                                                        {formatDisplayDate(request.date_requested || request.created_at, 'MM/DD/YYYY') ||
                                                            request.date_requested ||
                                                            request.created_at}
                                                    </td>

                                                    {/* Approval Status */}
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                        <RequestStatusBadge status={request.status} />
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setDetailsRequest(request)}
                                                                className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-xs py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>View</span>
                                                            </button>

                                                            {request.status === 'Pending' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(request)}
                                                                    className="text-red-950 dark:text-red-400 font-semibold text-xs py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    <span>Edit</span>
                                                                </button>
                                                            )}

                                                            {isReviewed && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openRis(request)}
                                                                    className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs px-2.5 py-1 rounded shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                                >
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                    <span>View RIS</span>
                                                                </button>
                                                            )}

                                                            {['Pending', 'Approved'].includes(request.status) && (
                                                                <button
                                                                    type="button"
                                                                    disabled={busy === request.id}
                                                                    onClick={() => cancel(request)}
                                                                    className="text-gray-400 hover:text-rose-700 dark:hover:text-rose-400 font-semibold text-xs py-1 px-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                                                                    title="Cancel Request"
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span>Cancel</span>
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
                            <div className="px-4 sm:px-6 lg:px-8 py-3.5 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <span className="text-gray-600 dark:text-slate-400 font-medium">
                                    Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{filtered.length}</strong>{' '}
                                    records
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                                        disabled={safePage <= 1}
                                        aria-label="Go to previous page"
                                        className="min-h-[36px] px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950 disabled:opacity-40 cursor-pointer"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-1 text-gray-600 dark:text-slate-400">
                                        Page <strong>{safePage}</strong> of <strong>{lastPage}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(Math.min(lastPage, safePage + 1))}
                                        disabled={safePage >= lastPage}
                                        aria-label="Go to next page"
                                        className="min-h-[36px] px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950 disabled:opacity-40 cursor-pointer"
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
