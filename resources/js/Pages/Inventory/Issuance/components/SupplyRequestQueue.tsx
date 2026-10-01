import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
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
import { getFundClusterDisplay } from '../constants';
import { RequestStatusBadge, ItemQuantityDisplay } from '../../Requests/components/RequestStatusBadge';

export type QueueRequest = {
    id: number;
    status: 'Pending' | 'Approved' | 'Issued' | 'Rejected' | 'Cancelled';
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
        issued_by_name?: string | null;
        issued_by_position?: string | null;
        date_issued?: string | null;
    } | null;
    items: {
        id: number;
        item_id: number;
        quantity: number;
        approved_quantity: number | null;
        item: { name: string; sku: string; unit_of_issue?: string; stock: number; unit_cost?: number };
    }[];
};

export function SupplyRequestQueue({
    requests,
    onPreview,
}: {
    requests: QueueRequest[];
    onPreview: (request: QueueRequest) => void;
}) {
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
    const pendingList = useMemo(() => requests.filter((r) => r.status === 'Pending'), [requests]);
    const approvedList = useMemo(() => requests.filter((r) => r.status === 'Approved'), [requests]);
    const allList = requests;

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
            nextMap[line.id] = full ? line.quantity : 0;
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

        request.items.forEach((line) => {
            const qty = getEffectiveQuantity(request.id, line.id, line.quantity, line.approved_quantity);
            approvedQuantities[line.id] = qty;
            totalApproved += qty;
        });

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
                remarks: remarks[request.id]?.trim() || (request.status === 'Approved' ? 'Approved quantities revised before release.' : 'Approved by Property Custodian.'),
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
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Top Maroon Header Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

            {/* Workspace Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300">
                                Property Custodian Workspace
                            </span>
                            <span className="text-xs text-gray-500 font-sans">
                                Supply Approval & Distribution Hub
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight mt-1">
                            Requisition Review & Approval Queue
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                            Review coordinator requests, adjust authorized item quantities based on available warehouse stock, approve or reject, and finalize item release.
                        </p>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 text-xs font-mono">
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
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800/60 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-white dark:bg-slate-900 text-red-950 dark:text-red-400 shadow-2xs font-bold'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Awaiting Approval ({pendingList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('approved')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                activeTab === 'approved'
                                    ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 shadow-2xs font-bold'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Approved & Release ({approvedList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                activeTab === 'all'
                                    ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs font-bold'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                            }`}
                        >
                            All Requests ({allList.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter queue by keyword..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900"
                        />
                    </div>
                </div>
            </div>

            {/* Error Notification Banner */}
            {actionError && (
                <div role="alert" className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span>{actionError}</span>
                    </div>
                    <button type="button" onClick={() => setActionError(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">×</button>
                </div>
            )}

            {/* Content Queue */}
            <div className="p-4 sm:p-6 space-y-5">
                {filteredRequests.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-slate-400 text-xs flex flex-col items-center">
                        <Clock className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-sm text-gray-700 dark:text-slate-300">
                            {activeTab === 'pending'
                                ? 'No supply requests awaiting approval'
                                : activeTab === 'approved'
                                ? 'No approved requests currently awaiting pickup'
                                : 'No matching supply requests found'}
                        </p>
                        <p className="text-gray-400 mt-0.5">
                            {searchQuery ? 'Try clearing your search query.' : 'New submissions from the Supply Coordinator will appear here.'}
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((request) => {
                        const isPending = request.status === 'Pending';
                        const isApproved = request.status === 'Approved';
                        const isIssued = request.status === 'Issued';
                        const isTerminal = ['Rejected', 'Cancelled'].includes(request.status);
                        const isBusy = busyId === request.id;

                        const totalRequested = request.items.reduce((sum, line) => sum + line.quantity, 0);

                        return (
                            <article
                                key={request.id}
                                className={`rounded-xl border transition-all ${
                                    isPending
                                        ? 'border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-slate-900/90 shadow-2xs'
                                        : isApproved
                                        ? 'border-blue-200/80 dark:border-blue-900/40 bg-white dark:bg-slate-900/90 shadow-2xs'
                                        : isIssued
                                        ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-900/90'
                                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50'
                                }`}
                            >
                                {/* Request Header Ribbon */}
                                <div className="p-4 sm:px-5 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/40 dark:bg-slate-900/40">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <span className="font-mono font-bold text-sm text-gray-900 dark:text-slate-100">
                                            {request.ris_number || `REQ-${String(request.id).padStart(4, '0')}`}
                                        </span>
                                        <RequestStatusBadge status={request.status} />
                                        <span className="text-[11px] text-gray-400 font-mono">
                                            Submitted {formatDisplayDate(request.date_requested || request.created_at, 'MM/DD/YYYY') || request.date_requested || request.created_at}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-500 font-medium">Submitted by:</span>
                                        <span className="font-semibold text-gray-800 dark:text-slate-200">
                                            {request.requester?.name || 'Supply Coordinator'}
                                        </span>
                                    </div>
                                </div>

                                {/* Requisition Details Body */}
                                <div className="p-4 sm:p-5 space-y-4">
                                    {/* Requester & Office Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs p-3 rounded-lg bg-gray-50/60 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800">
                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                                Intended Recipient
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-slate-100">
                                                {request.recipient || request.requester?.name || '—'}
                                            </span>
                                            {request.recipient_designation && (
                                                <span className="block text-[10px] text-gray-500 italic">
                                                    {request.recipient_designation}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                                Division / Office
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-slate-100">
                                                {request.department}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                                Fund Cluster
                                            </span>
                                            <span className="font-mono text-gray-800 dark:text-slate-200">
                                                {getFundClusterDisplay(request.fund_cluster) || '01 - Regular Agency Fund'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                                                Requisition Purpose
                                            </span>
                                            <span className="text-gray-700 dark:text-slate-300 truncate block" title={request.purpose}>
                                                {request.purpose}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items & Quantity Adjustment Table */}
                                    <div>
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                                    Requested Items ({request.items.length})
                                                </h4>
                                                <span className="text-[11px] text-gray-500 font-sans">
                                                    — Total units: {totalRequested}
                                                </span>
                                            </div>

                                            {/* Quantity adjustment helper buttons if reviewing/pending */}
                                            {(isPending || isApproved) && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-400 text-[11px] hidden sm:inline">Quick Adjust:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(request, true)}
                                                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-pointer"
                                                    >
                                                        Approve All Full
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(request, false)}
                                                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-pointer"
                                                    >
                                                        Zero All
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 uppercase font-mono text-[11px]">
                                                    <tr>
                                                        <th className="px-3 py-2">Item Description & SKU</th>
                                                        <th className="px-3 py-2 text-center">Warehouse Stock</th>
                                                        <th className="px-3 py-2 text-right">Requested</th>
                                                        <th className="px-3 py-2 text-right min-w-44">
                                                            {isPending || isApproved ? 'Authorized / Approved Qty' : 'Final Approved Qty'}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                                    {request.items.map((line) => {
                                                        const currentQty = getEffectiveQuantity(
                                                            request.id,
                                                            line.id,
                                                            line.quantity,
                                                            line.approved_quantity
                                                        );
                                                        const isStockShortage = line.item ? line.item.stock < line.quantity : false;
                                                        const isExceedingStock = line.item ? currentQty > line.item.stock : false;
                                                        const isAdjusted = isPending
                                                            ? currentQty !== line.quantity
                                                            : line.approved_quantity !== null && line.approved_quantity !== line.quantity;

                                                        return (
                                                            <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                                                <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-slate-100">
                                                                    <div className="font-semibold">{line.item?.name}</div>
                                                                    <div className="font-mono text-[10px] text-gray-400">
                                                                        SKU: {line.item?.sku || '—'}
                                                                    </div>
                                                                </td>

                                                                {/* On hand stock */}
                                                                <td className="px-3 py-2.5 text-center font-mono">
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                            line.item?.stock === 0
                                                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                                                : isStockShortage
                                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                                : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        {line.item?.stock ?? 0} {line.item?.unit_of_issue || 'pcs'}
                                                                    </span>
                                                                </td>

                                                                {/* Requested Qty */}
                                                                <td className="px-3 py-2.5 text-right font-mono text-gray-800 dark:text-slate-200">
                                                                    {line.quantity} {line.item?.unit_of_issue || 'pcs'}
                                                                </td>

                                                                {/* Approved / Adjustable Qty */}
                                                                <td className="px-3 py-2.5 text-right">
                                                                    {isPending || isApproved ? (
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {isExceedingStock && (
                                                                                <span
                                                                                    className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold"
                                                                                    title="Selected quantity exceeds available unreserved stock"
                                                                                >
                                                                                    Exceeds Stock!
                                                                                </span>
                                                                            )}
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={line.quantity}
                                                                                value={currentQty}
                                                                                onChange={(e) =>
                                                                                    handleQuantityChange(
                                                                                        request.id,
                                                                                        line.id,
                                                                                        parseInt(e.target.value, 10),
                                                                                        line.quantity
                                                                                    )
                                                                                }
                                                                                className={`w-24 h-8 px-2 text-right bg-white dark:bg-slate-950 border rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 ${
                                                                                    isExceedingStock
                                                                                        ? 'border-rose-400 text-rose-600 focus:border-rose-500 focus:ring-rose-500'
                                                                                        : isAdjusted
                                                                                        ? 'border-amber-400 text-amber-700 focus:border-amber-500 focus:ring-amber-500'
                                                                                        : 'border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 focus:border-red-900 focus:ring-red-900'
                                                                                }`}
                                                                            />
                                                                            <span className="text-[10px] text-gray-400 font-sans w-8 text-left">
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
                                    {(isPending || isApproved) && (
                                        <div className="space-y-1">
                                            <label
                                                htmlFor={`remarks-${request.id}`}
                                                className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400"
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
                                                className="w-full h-8 px-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:border-red-900"
                                            />
                                        </div>
                                    )}

                                    {/* Existing review remarks if completed or rejected */}
                                    {request.review_remarks && !isPending && !isApproved && (
                                        <div className="p-3 rounded bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs">
                                            <span className="font-semibold text-gray-700 dark:text-slate-300 font-mono text-[10px] uppercase">
                                                Review Notes:
                                            </span>
                                            <p className="text-gray-600 dark:text-slate-400 italic mt-0.5">
                                                "{request.review_remarks}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions Bar for Pending Requisitions */}
                                    {isPending && (
                                        <div className="pt-3 border-t border-gray-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-500 font-sans">
                                                    Ensure adjusted quantities reflect physically ready stock before approving.
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => openRejectModal(request)}
                                                    className="px-3 py-1.5 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Reject Requisition</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => handleApprove(request)}
                                                    className="px-4 py-1.5 bg-red-950 hover:bg-red-900 text-white rounded text-xs font-bold uppercase font-mono tracking-wider shadow-xs cursor-pointer disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                                    <span>{isBusy ? 'Processing...' : 'Approve Requisition'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions Bar for Approved Requisitions (Ready for Release) */}
                                    {isApproved && (
                                        <div className="pt-3 border-t border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-3 rounded-lg space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-bold text-xs text-blue-950 dark:text-blue-200">
                                                        Assigned RIS: {request.ris_number}
                                                    </div>
                                                    <div className="text-[11px] text-blue-800 dark:text-blue-300">
                                                        Approved by {request.reviewer?.name || 'Property Custodian'} on{' '}
                                                        {request.reviewed_at ? formatDisplayDate(request.reviewed_at, 'MM/DD/YYYY') : '—'}.
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onPreview(request)}
                                                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-50 rounded text-xs font-semibold cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>Preview / Print RIS</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleApprove(request)}
                                                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 underline cursor-pointer"
                                                        title="Save modified quantity adjustments"
                                                    >
                                                        Update Quantities
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Release Confirmation */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/50 dark:border-blue-900/40">
                                                <label className="flex items-start sm:items-center gap-2 text-xs font-medium text-blue-950 dark:text-blue-200 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!signedRisConfirmed[request.id]}
                                                        onChange={(e) =>
                                                            setSignedRisConfirmed((prev) => ({
                                                                ...prev,
                                                                [request.id]: e.target.checked,
                                                            }))
                                                        }
                                                        className="rounded text-red-900 focus:ring-red-900 mt-0.5 sm:mt-0"
                                                    />
                                                    <span>
                                                        Recipient presented physically signed RIS form. Ready to distribute stock.
                                                    </span>
                                                </label>

                                                <button
                                                    type="button"
                                                    disabled={!signedRisConfirmed[request.id] || isBusy}
                                                    onClick={() => handleRelease(request)}
                                                    className="px-4 py-1.5 bg-red-950 hover:bg-red-900 text-white rounded text-xs font-bold uppercase font-mono tracking-wider shadow-xs cursor-pointer disabled:opacity-40 transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                                                >
                                                    <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
                                                    <span>{isBusy ? 'Releasing...' : 'Confirm Release & Deduct Stock'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Released Notice for Issued Requests */}
                                    {isIssued && (
                                        <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>
                                                    Officially distributed on{' '}
                                                    <strong>
                                                        {request.issuance?.date_issued
                                                            ? formatDisplayDate(request.issuance.date_issued, 'MM/DD/YYYY')
                                                            : '—'}
                                                    </strong>{' '}
                                                    by{' '}
                                                    <strong>{request.issuance?.issued_by_name || 'Storekeeper'}</strong>.
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onPreview(request)}
                                                className="text-xs font-semibold underline text-emerald-800 dark:text-emerald-300 cursor-pointer"
                                            >
                                                View Archived RIS
                                            </button>
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
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden">
                    <div className="h-1.5 bg-rose-600" />
                    <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                    Reject Supply Request #{rejectingRequest?.id}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Please provide an explanation or reason for the rejection so the Supply Coordinator can review and adjust accordingly.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="rejection-reason"
                                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                            >
                                Rejection Justification / Reason <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                rows={3}
                                required
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Requested item is currently reserved for laboratory operations or out of stock..."
                                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setRejectingRequest(null)}
                                className="px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!rejectionReason.trim() || busyId === rejectingRequest?.id}
                                onClick={handleConfirmReject}
                                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-bold uppercase font-mono tracking-wider disabled:opacity-50 cursor-pointer"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
