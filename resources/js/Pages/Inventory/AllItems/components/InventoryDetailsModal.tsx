import React from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
import { X, Edit3, Tag, Package, History, Layers } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';
import { formatDisplayDate } from '@/utils/dateUtils';

interface InventoryDetailsModalProps {
    show: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    onEdit: (item: InventoryItem) => void;
}

export default function InventoryDetailsModal({
    show,
    item,
    onClose,
    onEdit,
}: InventoryDetailsModalProps) {
    if (!item) return null;

    const batches = item.receiving_batches || [];
    const recentIssuances = item.recent_issuances || [];

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Item Master Record">
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-gray-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-950 flex items-center justify-center border border-red-100/80 shadow-2xs shrink-0">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight font-serif">
                                Item Master Record
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Standardized consumable inventory identity and batch ledger.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
                    {/* 1. ITEM INFORMATION SECTION */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                            <Package className="w-4 h-4 text-red-900" />
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                Item Information
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/60 p-4 rounded-lg border border-gray-100">
                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Stock Number
                                </dt>
                                <dd className="mt-1 text-sm font-mono font-bold text-gray-900">
                                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200 inline-block">
                                        {item.sku || item.stock_no || 'N/A'}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Unit of Issue
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-gray-800 uppercase font-mono">
                                    {item.unit_of_issue || item.unit || '—'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Total On Hand
                                </dt>
                                <dd className="mt-1 text-sm font-bold text-gray-900 font-mono">
                                    {formatNumber(item.on_hand ?? item.stock)}{' '}
                                    <span className="text-gray-500 text-xs font-normal font-sans">
                                        {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Inventory Value
                                </dt>
                                <dd className="mt-1 text-sm font-bold text-emerald-800 font-mono">
                                    {formatCurrency(item.inventory_value ?? item.amount)}
                                </dd>
                            </div>
                        </div>

                        {/* Item Name & Full Specifications */}
                        <div className="mt-3 grid grid-cols-1 gap-3">
                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Item Name
                                </dt>
                                <dd className="mt-0.5 text-base font-bold text-gray-900">
                                    {item.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                    Specifications / Description
                                </dt>
                                <dd className="mt-0.5 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-2.5 rounded border border-gray-100">
                                    {item.description || 'No detailed specifications or notes recorded.'}
                                </dd>
                            </div>

                            {item.rfid_tag ? (
                                <div>
                                    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                        RFID Identification Tag
                                    </dt>
                                    <dd className="mt-0.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-red-950/5 text-red-950 border border-red-900/10">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>{item.rfid_tag}</span>
                                        </span>
                                    </dd>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* 2. RECEIVING HISTORY / BATCHES SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Receiving History & Active Batches
                                </h4>
                            </div>
                            <span className="text-xs text-slate-500 font-normal">
                                {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
                            </span>
                        </div>

                        {batches.length === 0 ? (
                            <div className="text-center py-6 px-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 text-gray-500">
                                <p className="text-xs font-medium">No separate receiving batches recorded yet.</p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Use the Receiving module to record incoming shipments from suppliers.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/80 border-b border-gray-200">
                                        <tr>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap w-[90px]">
                                                Date
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 min-w-[120px]">
                                                Supplier
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap w-[160px]">
                                                Supplier Stock No.
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-right whitespace-nowrap w-[70px]">
                                                Received
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-right whitespace-nowrap w-[75px]">
                                                Remaining
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-right whitespace-nowrap w-[80px]">
                                                Unit Cost
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-right whitespace-nowrap w-[100px]">
                                                Batch Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100 text-xs">
                                        {batches.map((batch) => (
                                            <tr key={batch.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-3 py-2.5 sm:py-3 align-middle whitespace-nowrap text-xs text-slate-600 tabular-nums">
                                                    {formatDisplayDate(batch.date_received, 'short') || batch.date_received}
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle text-xs font-medium text-slate-800 leading-snug">
                                                    {batch.supplier_name}
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle whitespace-nowrap">
                                                    {batch.supplier_stock_no ? (
                                                        <span
                                                            className="inline-block font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/70 whitespace-nowrap max-w-[170px] truncate align-middle"
                                                            title={batch.supplier_stock_no}
                                                        >
                                                            {batch.supplier_stock_no}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle text-right font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                                                    {formatNumber(batch.quantity_received)}
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle text-right font-mono text-xs tabular-nums whitespace-nowrap">
                                                    <span
                                                        className={
                                                            Number(batch.quantity_remaining) > 0
                                                                ? 'text-emerald-700 font-semibold'
                                                                : 'text-slate-400'
                                                        }
                                                    >
                                                        {formatNumber(batch.quantity_remaining)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle text-right font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                                                    {formatCurrency(batch.unit_cost)}
                                                </td>
                                                <td className="px-3 py-2.5 sm:py-3 align-middle text-right font-mono text-xs tabular-nums font-bold text-slate-900 whitespace-nowrap">
                                                    {formatCurrency(batch.batch_value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 3. RECENT ISSUANCE SECTION */}
                    {recentIssuances.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                <History className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Recent Issuance Allocations
                                </h4>
                            </div>

                            <div className="overflow-x-auto rounded border border-gray-200">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono">
                                                Date
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono">
                                                RIS Reference
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono">
                                                Recipient / Office
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Issued Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100 text-xs">
                                        {recentIssuances.map((iss) => (
                                            <tr key={iss.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2 font-mono text-gray-600">
                                                    {formatDisplayDate(iss.date_issued, 'MM/DD/YYYY') || iss.date_issued}
                                                </td>
                                                <td className="px-4 py-2 font-mono font-semibold text-gray-800">
                                                    {formatRisNumber(iss.ris_number)}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {iss.recipient}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-red-700 font-semibold">
                                                    -{formatNumber(iss.quantity)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">
                                                    {formatCurrency(iss.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Modal Footer */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-center"
                    >
                        Close
                    </button>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                        <Link
                            href={route('rfid-scanner.index', { item_id: item.id })}
                            className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                            <Tag className="w-3.5 h-3.5 text-red-900" />
                            <span>Tag RFID</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(item);
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Item Identity</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
