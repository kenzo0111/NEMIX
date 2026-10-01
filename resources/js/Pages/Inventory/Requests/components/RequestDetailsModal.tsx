import React from 'react';
import { ClipboardList, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { formatDisplayDate } from '@/utils/dateUtils';
import { SupplyRequest } from '../types';

export function RequestStatus({ status }: { status: SupplyRequest['status'] }) {
    const colors: Record<SupplyRequest['status'], string> = {
        Pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        Approved: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        Issued: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        Rejected: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        Cancelled: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700',
    };
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status]}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{status === 'Approved' ? 'Awaiting Release' : status}</span>;
}

export function RequestDetailsModal({ show, request, onClose }: { show: boolean; request: SupplyRequest | null; onClose: () => void }) {
    if (!request) return null;
    return <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Supply Request Details">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/75">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-950 dark:text-red-400"><ClipboardList className="w-5 h-5" /></div><div><h3 className="text-base font-bold font-serif">Supply Request #{request.id}</h3><p className="text-xs text-gray-500 dark:text-slate-400">Request details and review history</p></div></div>
                <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Office / Department</span><span className="font-semibold">{request.department}</span></div>
                    <div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</span><div className="mt-1"><RequestStatus status={request.status} /></div></div>
                    <div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date Requested</span>{formatDisplayDate(request.created_at, 'MM/DD/YYYY') || request.created_at}</div>
                    <div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">RIS No.</span><span className="font-mono">{request.ris_number || 'Assigned after approval'}</span></div>
                    <div className="sm:col-span-2"><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Purpose</span>{request.purpose}</div>
                </div>
                <div><h4 className="pb-2 mb-2 border-b border-gray-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">Requested Inventory Items ({request.items.length})</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 uppercase font-mono"><tr><th className="px-3 py-2">Item Description</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2 text-right">Requested</th><th className="px-3 py-2 text-right">Approved</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-slate-800">{request.items.map(line => <tr key={line.id}><td className="px-3 py-2.5 font-medium">{line.item?.name || 'Unavailable item'}</td><td className="px-3 py-2.5 font-mono text-gray-500">{line.item?.sku || '—'}</td><td className="px-3 py-2.5 text-right font-mono">{line.quantity} {line.item?.unit_of_issue || 'pcs'}</td><td className="px-3 py-2.5 text-right font-mono">{line.approved_quantity === null ? '—' : `${line.approved_quantity} ${line.item?.unit_of_issue || 'pcs'}`}</td></tr>)}</tbody></table></div>
                </div>
                {(request.reviewer || request.review_remarks) && <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-slate-800"><div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Reviewed By</span>{request.reviewer?.name || '—'}</div><div><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date Reviewed</span>{request.reviewed_at ? formatDisplayDate(request.reviewed_at, 'MM/DD/YYYY') : '—'}</div>{request.review_remarks && <div className="sm:col-span-2"><span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Remarks</span>{request.review_remarks}</div>}</div>}
                {request.status === 'Approved' && <p className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-900 dark:text-amber-300">Print the RIS, have it signed, and bring it to the property office for pickup.</p>}
            </div>
            <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-800 flex justify-end"><button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700">Close</button></div>
        </div>
    </Modal>;
}
