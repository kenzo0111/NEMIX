import React from 'react';
import { ClipboardList, X, FileText } from 'lucide-react';
import Modal from '@/Components/Modal';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getFundClusterDisplay } from '../../Issuance/constants';
import { SupplyRequest } from '../types';
import { RequestStatusBadge, ItemQuantityDisplay } from './RequestStatusBadge';

export function RequestDetailsModal({
    show,
    request,
    onClose,
    onOpenRis,
    defaultApprovedBy,
    defaultApprovedByDesignation,
    defaultIssuedBy,
    defaultIssuedByDesignation,
}: {
    show: boolean;
    request: SupplyRequest | null;
    onClose: () => void;
    onOpenRis?: (request: SupplyRequest) => void;
    defaultApprovedBy?: string;
    defaultApprovedByDesignation?: string;
    defaultIssuedBy?: string;
    defaultIssuedByDesignation?: string;
}) {
    if (!request) return null;

    const totalRequested = request.items.reduce((sum, line) => sum + line.quantity, 0);
    const totalApproved = request.items.reduce((sum, line) => sum + (line.approved_quantity ?? 0), 0);
    const isApprovedOrIssued = ['Approved', 'Issued'].includes(request.status);

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Supply Request Details">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/75 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-950 dark:text-red-400 border border-red-100 dark:border-red-900/40">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold font-serif text-gray-900 dark:text-slate-100">
                                {request.ris_number ? `Official RIS No. ${request.ris_number}` : `Supply Request #${request.id}`}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Requisition details, custodian review, and item quantities (Req #{request.id})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 text-xs">
                    {/* Status & RIS Header */}
                    <div className="p-4 rounded-lg bg-gray-50/70 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Current Status
                            </span>
                            <RequestStatusBadge status={request.status} />
                        </div>
                        <div className="text-right">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Official RIS No.
                            </span>
                            <span className="font-mono font-bold text-sm text-red-950 dark:text-red-400">
                                {request.ris_number || `RIS-${String(request.id).padStart(4, '0')}`}
                            </span>
                        </div>
                    </div>

                    {/* Request Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Recipient Name
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-slate-100">
                                {request.recipient || request.requester?.name || 'N/A'}
                            </span>
                            {request.recipient_designation && (
                                <span className="block text-[11px] text-gray-500 dark:text-slate-400">
                                    {request.recipient_designation}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Office / Department
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-slate-100">
                                {request.department}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Date Requested
                            </span>
                            <span className="font-mono text-gray-800 dark:text-slate-200">
                                {formatDisplayDate(request.date_requested || request.created_at, 'MM/DD/YYYY') || request.date_requested || request.created_at}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Fund Cluster
                            </span>
                            <span className="font-medium text-gray-800 dark:text-slate-200">
                                {getFundClusterDisplay(request.fund_cluster) || '01 - Regular Agency Fund'}
                            </span>
                        </div>
                        <div className="sm:col-span-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Requisition Purpose
                            </span>
                            <p className="mt-0.5 text-gray-800 dark:text-slate-200 leading-relaxed bg-gray-50 dark:bg-slate-950 p-2.5 rounded border border-gray-200 dark:border-slate-800">
                                {request.purpose}
                            </p>
                        </div>
                    </div>

                    {/* Requested & Approved Items Table */}
                    <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                Requested Items ({request.items.length})
                            </h4>
                            <div className="text-right text-[11px] font-mono text-gray-500">
                                <span>Total Requested: <strong>{totalRequested}</strong></span>
                                {isApprovedOrIssued && (
                                    <span className="ml-3 text-red-950 dark:text-red-400 font-bold">
                                        Approved: {totalApproved}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 uppercase font-mono">
                                    <tr>
                                        <th className="px-3 py-2">Item Description</th>
                                        <th className="px-3 py-2">SKU</th>
                                        <th className="px-3 py-2 text-right">Requested Qty</th>
                                        <th className="px-3 py-2 text-right">Approved / Final Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {request.items.map((line) => (
                                        <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-slate-100">
                                                {line.item?.name || 'Unavailable item'}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-gray-500">
                                                {line.item?.sku || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono">
                                                {line.quantity} {line.item?.unit_of_issue || 'pcs'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <ItemQuantityDisplay
                                                    requested={line.quantity}
                                                    approved={line.approved_quantity}
                                                    unit={line.item?.unit_of_issue}
                                                    status={request.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Review Details (Custodian Remarks) */}
                    {(request.reviewer || request.review_remarks || request.reviewed_at) && (
                        <div className="p-4 rounded-lg bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                Property Custodian Review
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        Reviewed By
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {defaultApprovedBy || request.reviewer?.name || 'Property Custodian'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        Date Reviewed
                                    </span>
                                    <span className="font-mono text-gray-800 dark:text-slate-200">
                                        {request.reviewed_at ? formatDisplayDate(request.reviewed_at, 'MM/DD/YYYY') : '—'}
                                    </span>
                                </div>
                                {request.review_remarks && (
                                    <div className="sm:col-span-2">
                                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                            Custodian Remarks & Instructions
                                        </span>
                                        <p className="mt-0.5 text-gray-800 dark:text-slate-200 italic bg-white dark:bg-slate-900 p-2.5 rounded border border-red-200/60 dark:border-red-900/60">
                                            "{request.review_remarks}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Issuance Release Details */}
                    {request.status === 'Issued' && request.issuance && (
                        <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400 font-mono">
                                Release & Distribution Details
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        Issued By
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {request.issuance.issued_by_name || defaultIssuedBy || 'Supply Storekeeper'}
                                    </span>
                                    {(request.issuance.issued_by_position || defaultIssuedByDesignation) && (
                                        <span className="block text-[11px] text-gray-500">
                                            {request.issuance.issued_by_position || defaultIssuedByDesignation}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        Date Released
                                    </span>
                                    <span className="font-mono text-gray-800 dark:text-slate-200">
                                        {request.issuance.date_issued ? formatDisplayDate(request.issuance.date_issued, 'MM/DD/YYYY') : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {request.status === 'Approved' && (
                        <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3 text-blue-900 dark:text-blue-300 text-xs">
                            <p className="font-semibold mb-0.5">Approved & Ready for Pickup</p>
                            <p className="text-[11px] text-blue-800 dark:text-blue-400">
                                Please print the official Requisition and Issue Slip (RIS), acquire recipient signatures, and present it to the Property Office upon physical item release.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        {isApprovedOrIssued && onOpenRis && (
                            <button
                                type="button"
                                onClick={() => onOpenRis(request)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950 hover:bg-red-900 text-white rounded text-xs font-semibold shadow-xs"
                            >
                                <FileText className="w-3.5 h-3.5 text-amber-300" />
                                View / Print RIS
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
