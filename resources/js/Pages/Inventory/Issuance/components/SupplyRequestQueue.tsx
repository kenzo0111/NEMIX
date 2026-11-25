import { formatScreenDate } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import SupportingDocumentPanel from '../../Requests/components/SupportingDocumentPanel';
import { SupplyRequest } from '../../Requests/types';
import { PageProps } from '@/types';
import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    XCircle,
    FileText,
    Clock,
    AlertTriangle,
    PackageCheck,
    Search,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    Send,
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import Modal from '@/Components/Modal';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getRisCalendarDate } from '@/utils/risFormatter';
import { getFundClusterDisplay } from '../constants';
import { RequestStatusBadge, ItemQuantityDisplay } from '../../Requests/components/RequestStatusBadge';
import useAuthorization from '@/Hooks/useAuthorization';

export type QueueRequest = {
    id: number;
    status: SupplyRequest['status'];
    requires_supporting_document?: boolean;
    supporting_document_type?: string | null;
    supporting_document_name?: string | null;
    document_verified_at?: string | null;
    document_verification_remarks?: string | null;
    document_verifier?: { name: string } | null;
    recipient?: string | null;
    recipient_designation?: string | null;
    fund_cluster?: string | null;
    date_requested?: string | null;
    department: string;
    purpose: string;
    ris_number: string | null;
    created_at: string;
    reviewed_at: string | null;
    review_remarks: string | null;
    requester: { id?: number; name: string; email?: string };
    reviewer: { id?: number; name: string } | null;
    issuance?: {
        id?: number;
        ris_number?: string | null;
        recipient?: string | null;
        recipient_designation?: string | null;
        issued_by_name?: string | null;
        issued_by_position?: string | null;
        date_issued?: string | null;
        items?: any[];
    } | null;
    items: {
        id: number;
        item_id: number;
        quantity: number;
        approved_quantity: number | null;
        max_approval_quantity?: number;
        quota_remaining?: number;
        item: { name: string; sku: string; unit_of_issue?: string; stock: number; unit_cost?: number; stock_no?: string | null; supplier_stock_no?: string | null };
    }[];
};

export function SupplyRequestQueue({
    requests,
    onPreview,
    defaultApprovedBy,
    focusRequestId,
}: {
    requests: QueueRequest[];
    onPreview: (request: QueueRequest) => void;
    defaultApprovedBy?: string;
    focusRequestId?: number | null;
}) {
    const { can } = useAuthorization();
    const page = usePage<PageProps>();
    const strictStock = page.props.system?.settings?.['inventory.strict_stock_enforcement'] !== false;
    const loginAccount = page.props.auth?.user?.username || page.props.auth?.user?.email || page.props.auth?.user?.name || 'Inventory Staff';
    const canApprove = can('inventory.requests.approve');
    const canReject = can('inventory.requests.reject');
    const canRelease = can('inventory.requests.release');
    // Workspace tabs: 'pending' | 'approved' | 'all'
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Adjusted quantities state: [requestId][lineId] => quantity
    const [quantities, setQuantities] = useState<Record<number, Record<number, number>>>({});
    // Remarks per request: [requestId] => string
    const [remarks, setRemarks] = useState<Record<number, string>>({});

    // Rejection modal state
    const [rejectingRequest, setRejectingRequest] = useState<QueueRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Signed RIS confirmation checklist
    const [signedRisConfirmed, setSignedRisConfirmed] = useState<Record<number, boolean>>({});

    // Processing states
    const [busyId, setBusyId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Filter counts
    const pendingList = useMemo(() => requests.filter((r) => ['Pending', 'Pending Verification', 'Under Review', 'For Correction'].includes(r.status)), [requests]);
    const approvedList = useMemo(() => requests.filter((r) => ['Approved', 'Ready for Pickup'].includes(r.status)), [requests]);
    const allList = requests;

    useEffect(() => {
        if (!focusRequestId) return;
        const focused = requests.find((request) => request.id === focusRequestId);
        if (!focused) return;
        setActiveTab(['Pending', 'Pending Verification', 'Under Review', 'For Correction'].includes(focused.status) ? 'pending' : ['Approved', 'Ready for Pickup'].includes(focused.status) ? 'approved' : 'all');
        setSearchQuery(focused.ris_number || String(focusRequestId));
        const timer = window.setTimeout(() => document.getElementById(`supply-request-${focusRequestId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        return () => window.clearTimeout(timer);
    }, [focusRequestId, requests]);

    // Filter by search
    const filteredRequests = useMemo(() => {
        const list = activeTab === 'pending' ? pendingList : activeTab === 'approved' ? approvedList : allList;
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase().trim();
        return list.filter((r) => {
            return [
                String(r.id),
                r.ris_number || '',
                r.requester?.name || '',
                r.recipient || '',
                r.department,
                r.purpose,
                ...r.items.map((i) => i.item?.name || ''),
                ...r.items.map((i) => i.item?.sku || ''),
            ].some((val) => val.toLowerCase().includes(q));
        });
    }, [activeTab, pendingList, approvedList, allList, searchQuery]);

    // Quantity helpers
    const getEffectiveQuantity = (requestId: number, lineId: number, originalQuantity: number, approvedQuantity: number | null): number => {
        if (quantities[requestId]?.[lineId] !== undefined) {
            return quantities[requestId][lineId];
        }
        return approvedQuantity !== null && approvedQuantity !== undefined ? approvedQuantity : originalQuantity;
    };

    const handleQuantityChange = (requestId: number, lineId: number, value: number, max: number) => {
        const cleanVal = Math.max(0, Math.min(max, isNaN(value) ? 0 : value));
        setQuantities((prev) => ({
            ...prev,
            [requestId]: {
                ...(prev[requestId] || {}),
                [lineId]: cleanVal,
            },
        }));
    };

    const handleSetAllQuantities = (request: QueueRequest, full: boolean) => {
        const nextMap: Record<number, number> = {};
        request.items.forEach((line) => {
            nextMap[line.id] = full ? (line.max_approval_quantity ?? line.quantity) : 0;
        });
        setQuantities((prev) => ({
            ...prev,
            [request.id]: nextMap,
        }));
    };

    // Submissions
    const handleApprove = (request: QueueRequest) => {
        const approvedQuantities: Record<number, number> = {};
        let totalApproved = 0;
        let exceedsAllowance = false;

        request.items.forEach((line) => {
            const qty = getEffectiveQuantity(request.id, line.id, line.quantity, line.approved_quantity);
            approvedQuantities[line.id] = qty;
            exceedsAllowance ||= qty > (line.max_approval_quantity ?? line.quantity);
            totalApproved += qty;
        });

        if (exceedsAllowance) {
            setActionError('Stock or weekly allowance changed. Review the current maximum quantity for each item.');
            return;
        }

        if (totalApproved <= 0) {
            setActionError(`Cannot approve request #${request.id} with 0 total quantity. To deny this requisition, use the Reject option.`);
            return;
        }

        setBusyId(request.id);
        setActionError(null);

        router.post(
            route('inventory.requests.approve', request.id),
            {
                approved_quantities: approvedQuantities,
                remarks: remarks[request.id]?.trim() || 'Approved by Inventory Staff.',
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setActionError(Object.values(errors).join(' '));
                },
                onFinish: () => setBusyId(null),
            }
        );
    };

    const openRejectModal = (request: QueueRequest) => {
        setRejectingRequest(request);
        setRejectionReason('');
        setActionError(null);
    };

    const handleConfirmReject = () => {
        if (!rejectingRequest) return;
        if (!rejectionReason.trim()) {
            setActionError('Please specify the justification or reason for rejection.');
            return;
        }

        setBusyId(rejectingRequest.id);
        router.post(
            route('inventory.requests.reject', rejectingRequest.id),
            {
                remarks: rejectionReason.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectingRequest(null);
                    setRejectionReason('');
                },
                onError: (errors) => {
                    setActionError(Object.values(errors).join(' '));
                },
                onFinish: () => setBusyId(null),
            }
        );
    };

    const handleRelease = (request: QueueRequest) => {
        if (!signedRisConfirmed[request.id]) {
            setActionError(`Please confirm verification of the signed RIS document before releasing items for request #${request.id}.`);
            return;
        }

        setBusyId(request.id);
        setActionError(null);

        router.post(
            route('inventory.requests.release', request.id),
            {
                signed_ris_presented: true,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setActionError(Object.values(errors).join(' '));
                },
                onFinish: () => setBusyId(null),
            }
        );
    };

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Maroon Header Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

            {/* Workspace Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-sm tabular-nums font-semibold normal-case tracking-normal bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300">
                                Inventory Custodian Workspace
                            </span>
                            <span className="text-sm text-slate-500 font-sans dark:text-slate-300">
                                Supply Approval & Distribution Hub
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight mt-1">
                            Requisition Review & Approval Queue
                        </h2>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Adjust quantities during pending verification and review, approve or reject, then release the approved quantities.
                        </p>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 text-sm tabular-nums">
                        <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span><strong>{pendingList.length}</strong> Pending</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span><strong>{approvedList.length}</strong> Awaiting Release</span>
                        </div>
                    </div>
                </div>

                {/* Workspace Navigation Tabs & Search */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
                        <Button variant="tab" aria-pressed={activeTab === 'pending'}
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className=""
                        >
                            Awaiting Approval ({pendingList.length})
                        </Button>
                        <Button variant="tab" aria-pressed={activeTab === 'approved'}
                            type="button"
                            onClick={() => setActiveTab('approved')}
                            className=""
                        >
                            Approved & Release ({approvedList.length})
                        </Button>
                        <Button variant="tab" aria-pressed={activeTab === 'all'}
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className=""
                        >
                            All Requests ({allList.length})
                        </Button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-300">
                            <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter queue by keyword..."
                            className="ui-field w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900"
                        />
                    </div>
                </div>
            </div>

            {/* Error Notification Banner */}
            {actionError && (
                <div role="alert" className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span>{actionError}</span>
                    </div>
                    <Button variant="secondary" type="button" onClick={() => setActionError(null)} className="">×</Button>
                </div>
            )}

            {/* Content Queue */}
            <div className="p-4 sm:p-6 space-y-5">
                {filteredRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-400 mb-2" />
                        <p className="leading-relaxed font-semibold text-sm text-slate-700 dark:text-slate-300">
                            {activeTab === 'pending'
                                ? 'No supply requests awaiting approval'
                                : activeTab === 'approved'
                                ? 'No approved requests currently awaiting pickup'
                                : 'No matching supply requests found'}
                        </p>
                        <p className="text-slate-500 mt-0.5 dark:text-slate-300">
                            {searchQuery ? 'Try clearing your search query.' : 'New submissions from the Supply Coordinator will appear here.'}
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((request) => {
                        const isPending = ['Pending', 'Under Review'].includes(request.status);
                        const canAdjustQuantities = canApprove && (isPending || request.status === 'Pending Verification');
                        const isApproved = ['Approved', 'Ready for Pickup'].includes(request.status);
                        const isIssued = ['Issued', 'Released'].includes(request.status);
                        const isTerminal = ['Rejected', 'Cancelled'].includes(request.status);
                        const isBusy = busyId === request.id;

                        const totalRequested = request.items.reduce((sum, line) => sum + line.quantity, 0);

                        return (
                            <article
                                key={request.id}
                                id={`supply-request-${request.id}`}
                                className={`rounded-xl border transition-all ${isPending
    ? "border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-slate-900/90 shadow-sm" : isApproved
    ? "border-blue-200/80 dark:border-blue-900/40 bg-white dark:bg-slate-900/90 shadow-sm" : isIssued
    ? "border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-900/90" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"}`}
                            >
                                {/* Request Header Ribbon */}
                                <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold normal-case tracking-normal text-slate-500 tabular-nums dark:text-slate-300">
                                                Official RIS No.
                                            </span>
                                            <span className="tabular-nums font-semibold text-sm text-red-950 dark:text-red-400">
                                                {request.ris_number || `RIS-${String(request.id).padStart(4, '0')}`}
                                            </span>
                                            <span className="text-sm text-slate-500 tabular-nums dark:text-slate-300">
                                                (Req #{request.id})
                                            </span>
                                        </div>
                                        <RequestStatusBadge status={request.status} />
                                        <span className="text-sm text-slate-500 tabular-nums dark:text-slate-300">
                                            Submitted {formatScreenDate(request.date_requested || request.created_at) || request.date_requested || request.created_at}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500 font-medium dark:text-slate-300">Submitted by:</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {request.requester?.name || 'Supply Coordinator'}
                                        </span>
                                    </div>
                                </div>

                                {/* Requisition Details Body */}
                                <div className="p-4 sm:p-5 space-y-4">
                                    {/* Requester & Office Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm p-3 rounded-lg bg-slate-50/60 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 tabular-nums dark:text-slate-300">
                                                Requested by
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {request.recipient || request.requester?.name || '—'}
                                            </span>
                                            {request.recipient_designation && (
                                                <span className="block text-sm text-slate-500 italic dark:text-slate-300">
                                                    {request.recipient_designation}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 tabular-nums dark:text-slate-300">
                                                Division / Office
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {request.department}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 tabular-nums dark:text-slate-300">
                                                Fund Cluster
                                            </span>
                                            <span className="tabular-nums text-slate-800 dark:text-slate-200">
                                                {getFundClusterDisplay(request.fund_cluster) || '01 - Regular Agency Fund'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 tabular-nums dark:text-slate-300">
                                                Requisition Purpose
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-300 truncate block" title={request.purpose}>
                                                {request.purpose}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items & Quantity Adjustment Table */}
                                    <div>
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                                    Requested Items ({request.items.length})
                                                </h4>
                                                <span className="text-sm text-slate-500 font-sans dark:text-slate-300">
                                                    — Total units: {totalRequested}
                                                </span>
                                            </div>

                                            {/* Quantity adjustment helper buttons if reviewing/pending */}
                                            {canAdjustQuantities && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-500 text-sm hidden sm:inline dark:text-slate-300">Quick Adjust:</span>
                                                    <Button variant="secondary"
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(request, true)}
                                                        className=""
                                                    >
                                                        Approve All Full
                                                    </Button>
                                                    <Button variant="secondary"
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(request, false)}
                                                        className=""
                                                    >
                                                        Zero All
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                            <table className="ui-data-table w-full text-left text-sm min-w-[38rem]">
                                                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 normal-case tabular-nums text-sm">
                                                    <tr>
                                                        <th className="px-3.5 py-3.5 whitespace-nowrap min-w-[12.5rem] align-middle">Item Description & SKU</th>
                                                        <th className="px-3.5 py-3.5 text-center whitespace-nowrap min-w-[8rem] align-middle">Warehouse Stock</th>
                                                        <th className="px-3.5 py-3.5 text-right whitespace-nowrap min-w-[7rem] align-middle">Requested</th>
                                                        <th className="px-3.5 py-3.5 text-right whitespace-nowrap min-w-[11rem] align-middle">
                                                            {canAdjustQuantities ? 'Authorized / Approved Qty' : 'Final Approved Qty'}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {request.items.map((line) => {
                                                        const currentQty = getEffectiveQuantity(
                                                            request.id,
                                                            line.id,
                                                            line.quantity,
                                                            line.approved_quantity
                                                        );
                                                        const isStockShortage = line.item ? line.item.stock < line.quantity : false;
                                                        const isExceedingStock = currentQty > (line.max_approval_quantity ?? line.item?.stock ?? 0);
                                                        const isAdjusted = canAdjustQuantities
                                                            ? currentQty !== line.quantity
                                                            : line.approved_quantity !== null && line.approved_quantity !== line.quantity;

                                                        return (
                                                            <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                                <td className="px-3.5 py-3.5 font-medium text-slate-900 dark:text-slate-100 align-middle">
                                                                    <div className="font-semibold">{line.item?.name}</div>
                                                                    <div className="tabular-nums text-sm text-slate-500 dark:text-slate-300">
                                                                        SKU: {line.item?.sku || '—'}
                                                                    </div>
                                                                </td>

                                                                {/* On hand stock */}
                                                                <td className="px-3.5 py-3.5 text-center tabular-nums align-middle">
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${line.item?.stock === 0
    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : isStockShortage
    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}
                                                                    >
                                                                        {line.item?.stock ?? 0} {line.item?.unit_of_issue || 'pcs'}
                                                                    </span>
                                                                </td>

                                                                {/* Requested Qty */}
                                                                <td className="px-3.5 py-3.5 text-right tabular-nums text-slate-800 dark:text-slate-200 align-middle">
                                                                    {line.quantity} {line.item?.unit_of_issue || 'pcs'}
                                                                </td>

                                                                {/* Approved / Adjustable Qty */}
                                                                <td className="px-3.5 py-3.5 text-right align-middle">
                                                                    {canAdjustQuantities ? (
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {isExceedingStock && (
                                                                                <span
                                                                                    className="text-sm text-rose-600 dark:text-rose-400 font-semibold"
                                                                                    title="Selected quantity exceeds available unreserved stock"
                                                                                >
                                                                                    Exceeds allowance!
                                                                                </span>
                                                                            )}
                                                                            <input aria-invalid={Boolean(isExceedingStock)}
                                                                                type="number"
                                                                                min="0"
                                                                                max={line.max_approval_quantity ?? line.quantity}
                                                                                value={currentQty}
                                                                                onChange={(e) =>
                                                                                    handleQuantityChange(
                                                                                        request.id,
                                                                                        line.id,
                                                                                        parseInt(e.target.value, 10),
                                                                                        line.max_approval_quantity ?? line.quantity
                                                                                    )
                                                                                }
                                                                                className={"ui-field " + (`w-24 h-8 px-2 text-right bg-white dark:bg-slate-950 border rounded text-sm tabular-nums font-semibold focus:outline-none focus:ring-1 ${isExceedingStock
    ? "border-rose-400 text-rose-600 focus:border-rose-500 focus:ring-rose-500" : isAdjusted
    ? "border-amber-400 text-amber-700 focus:border-amber-500 focus:ring-amber-500" : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-red-900 focus:ring-red-900"}`)}
                                                                            />
                                                                            <span className="text-sm text-slate-500 font-sans w-8 text-left dark:text-slate-300">
                                                                                {line.item?.unit_of_issue || 'pcs'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <ItemQuantityDisplay
                                                                            requested={line.quantity}
                                                                            approved={line.approved_quantity}
                                                                            unit={line.item?.unit_of_issue}
                                                                            status={request.status}
                                                                        />
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Review Remarks Field (Custodian Notes) */}
                                    {canAdjustQuantities && (
                                        <div className="space-y-1">
                                            <label
                                                htmlFor={`remarks-${request.id}`}
                                                className="block text-sm font-semibold text-slate-600 dark:text-slate-400"
                                            >
                                                Custodian Review Remarks & Allocation Notes (Optional)
                                            </label>
                                            <input
                                                id={`remarks-${request.id}`}
                                                type="text"
                                                value={remarks[request.id] ?? request.review_remarks ?? ''}
                                                onChange={(e) =>
                                                    setRemarks((prev) => ({ ...prev, [request.id]: e.target.value }))
                                                }
                                                placeholder="e.g. Approved with partial ream quantity due to scheduled delivery next week..."
                                                className="ui-field w-full h-8 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-900"
                                            />
                                        </div>
                                    )}

                                    {/* Existing review remarks if completed or rejected */}
                                    {request.review_remarks && !canAdjustQuantities && (
                                        <div className="p-3 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums text-sm normal-case">
                                                Review Notes:
                                            </span>
                                            <p className="text-slate-600 dark:text-slate-400 italic mt-0.5">
                                                "{request.review_remarks}"
                                            </p>
                                        </div>
                                    )}

                                    <SupportingDocumentPanel request={request} review />
                                    {request.status === 'Pending Verification' && canAdjustQuantities && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Adjust quantities here, then verify the supporting document. Your adjustments are saved when you approve the requisition.
                                        </p>
                                    )}
                                    {/* Actions Bar for Pending Requisitions */}
                                    {isPending && (canApprove || canReject) && (
                                        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500 font-sans dark:text-slate-300">
                                                    Approval saves the final quantities and deducts stock immediately. Quantities are checked against available warehouse stock and the requester's weekly allowance.
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                {canReject && <Button variant="danger"
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => openRejectModal(request)}
                                                    className="inline-flex items-center gap-1.5"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Reject Requisition</span>
                                                </Button>}

                                                {canApprove && request.status !== 'Ready for Pickup' && <Button variant="primary"
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => handleApprove(request)}
                                                    className="tabular-nums inline-flex items-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                                    <span>{isBusy ? 'Processing...' : 'Approve Requisition'}</span>
                                                </Button>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions Bar for Approved Requisitions (Ready for Release) */}
                                    {isApproved && (
                                        <div className="pt-3 border-t border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-3 rounded-lg space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-semibold text-sm text-blue-950 dark:text-blue-200">
                                                        Official RIS No.: {request.ris_number || `RIS-${String(request.id).padStart(4, '0')}`}
                                                    </div>
                                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                                        Approved by {loginAccount} on{' '}
                                                        {request.reviewed_at ? formatScreenDate(getRisCalendarDate(request.reviewed_at)) : '—'}.
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button variant="secondary"
                                                        type="button"
                                                        onClick={() => onPreview(request)}
                                                        className="inline-flex items-center gap-1.5"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                                                        <span>Preview / Print RIS</span>
                                                    </Button>

                                                </div>
                                            </div>

                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                Quantities were finalized during review. Release the approved quantities shown above.
                                            </p>

                                            {/* Release Confirmation */}
                                            {request.requires_supporting_document && request.status === 'Approved' && can('inventory.requests.ready') && <Button variant="primary" type="button" disabled={isBusy} onClick={() => { setBusyId(request.id); router.post(route('inventory.requests.ready', request.id), {}, { preserveScroll: true, onError: errors => setActionError(Object.values(errors).join(' ')), onFinish: () => setBusyId(null) }); }} className="">Mark Ready for Pickup & Notify Requester</Button>}
                                            {canRelease && (!request.requires_supporting_document || request.status === 'Ready for Pickup') && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/50 dark:border-blue-900/40">
                                                <label className="flex items-start sm:items-center gap-2 text-sm font-medium text-blue-950 dark:text-blue-200 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!signedRisConfirmed[request.id]}
                                                        onChange={(e) =>
                                                            setSignedRisConfirmed((prev) => ({
                                                                ...prev,
                                                                [request.id]: e.target.checked,
                                                            }))
                                                        }
                                                        className="rounded text-red-900 focus:ring-red-900 mt-0.5 sm:mt-0 dark:text-red-300"
                                                    />
                                                    <span>
                                                        Recipient presented physically signed RIS form. Ready to distribute stock.
                                                    </span>
                                                </label>

                                                <Button variant="primary"
                                                    type="button"
                                                    disabled={!signedRisConfirmed[request.id] || isBusy}
                                                    onClick={() => handleRelease(request)}
                                                    className="tabular-nums inline-flex items-center justify-center gap-1.5 shrink-0"
                                                >
                                                    <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
                                                    <span>{isBusy ? 'Releasing...' : 'Confirm Signed Handover & Release'}</span>
                                                </Button>
                                            </div>}
                                        </div>
                                    )}

                                    {/* Released Notice for Issued Requests */}
                                    {isIssued && (
                                        <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 dark:text-emerald-300" />
                                                <span>
                                                    Officially distributed on{' '}
                                                    <strong>
                                                        {request.issuance?.date_issued
                                                            ? formatScreenDate(request.issuance.date_issued)
                                                            : '—'}
                                                    </strong>{' '}
                                                    by{' '}
                                                    <strong>{request.issuance?.issued_by_name || 'Storekeeper'}</strong>.
                                                </span>
                                            </span>
                                            <Button variant="secondary"
                                                type="button"
                                                onClick={() => onPreview(request)}
                                                className="underline"
                                            >
                                                View Archived RIS
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* Rejection Modal */}
            <Modal
                show={!!rejectingRequest}
                onClose={() => setRejectingRequest(null)}
                maxWidth="md"
                ariaLabel="Reject Supply Request"
            >
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none overflow-hidden">
                    <div className="h-1.5 bg-rose-600" />
                    <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Reject {rejectingRequest?.ris_number ? `RIS ${rejectingRequest.ris_number}` : `Supply Request #${rejectingRequest?.id}`}
                                </h3>
                                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400">
                                    Please provide an explanation or reason for the rejection so the Supply Coordinator can review and adjust accordingly.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="rejection-reason"
                                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Rejection Justification / Reason <span className="text-rose-600 dark:text-rose-300">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                rows={3}
                                required
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Requested item is currently reserved for laboratory operations or out of stock..."
                                className="ui-field w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="secondary"
                                type="button"
                                onClick={() => setRejectingRequest(null)}
                                className=""
                            >
                                Cancel
                            </Button>
                            <Button variant="secondary"
                                type="button"
                                disabled={!rejectionReason.trim() || busyId === rejectingRequest?.id}
                                onClick={handleConfirmReject}
                                className="tabular-nums"
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
