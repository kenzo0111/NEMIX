import React from 'react';
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
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-red-950" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-red-50 text-red-950 flex items-center justify-center border border-red-100">
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
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Receiving History & Active Batches
                                </h4>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                                {batches.length} {batches.length === 1 ? 'batch' : 'batches'} recorded
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
                            <div className="overflow-x-auto rounded border border-gray-200">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono">
                                                Date
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono">
                                                Supplier
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Received
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Remaining
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Unit Cost
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-gray-700 uppercase font-mono text-right">
                                                Batch Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100 text-xs">
                                        {batches.map((batch) => (
                                            <tr key={batch.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2.5 font-mono text-gray-600">
                                                    {formatDisplayDate(batch.date_received, 'MM/DD/YYYY') || batch.date_received}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-gray-800">
                                                    {batch.supplier_name}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                                    {formatNumber(batch.quantity_received)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                                    <span className={batch.quantity_remaining > 0 ? 'text-emerald-700' : 'text-gray-400'}>
                                                        {formatNumber(batch.quantity_remaining)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                                    {formatCurrency(batch.unit_cost)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
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
                                                    {iss.ris_number}
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('rfid-scanner.index', { item_id: item.id })}
                            className="px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
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
                            className="px-4 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors inline-flex items-center gap-1.5 shadow-xs"
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
