import React, { useMemo } from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
import { X, Edit3, Tag, Package, History, Layers, Trash2 } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { InventoryItem, ReceivingBatchRecord, RecentIssuanceRecord } from '../types';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';
import { formatDisplayDate } from '@/utils/dateUtils';

interface InventoryDetailsModalProps {
    show: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    onEdit: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
    readOnly?: boolean;
}

export default function InventoryDetailsModal({
    show,
    item,
    onClose,
    onEdit,
    onDelete,
    readOnly = false,
}: InventoryDetailsModalProps) {
    const { can } = useAuthorization();
    const batchAccessors = useMemo(() => ({
        date: (batch: ReceivingBatchRecord) => new Date(batch.date_received),
        supplier: (batch: ReceivingBatchRecord) => batch.supplier_name,
        stock_no: (batch: ReceivingBatchRecord) => batch.supplier_stock_no,
        received: (batch: ReceivingBatchRecord) => batch.quantity_received,
        remaining: (batch: ReceivingBatchRecord) => batch.quantity_remaining,
        cost: (batch: ReceivingBatchRecord) => batch.unit_cost,
        value: (batch: ReceivingBatchRecord) => batch.batch_value,
    }), []);
    const issuanceAccessors = useMemo(() => ({
        date: (record: RecentIssuanceRecord) => new Date(record.date_issued),
        reference: (record: RecentIssuanceRecord) => record.ris_number,
        recipient: (record: RecentIssuanceRecord) => record.recipient,
        quantity: (record: RecentIssuanceRecord) => record.quantity,
        value: (record: RecentIssuanceRecord) => record.amount,
    }), []);
    const { sortedRows: batches, sort: batchSort, requestSort: sortBatches } = useSortableData(item?.receiving_batches || [], batchAccessors, { key: 'date', direction: 'desc' });
    const { sortedRows: recentIssuances, sort: issuanceSort, requestSort: sortIssuances } = useSortableData(item?.recent_issuances || [], issuanceAccessors, { key: 'date', direction: 'desc' });
    if (!item) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Item Master Record">
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight font-sans">
                                Item Master Record
                            </h3>
                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium">
                                Standardized consumable inventory identity and batch ledger.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
                    {/* 1. ITEM INFORMATION SECTION */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <Package className="w-4 h-4 text-red-900 dark:text-red-400" />
                            <h4 className="text-base font-bold text-gray-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                Item Information
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Stock Number
                                </dt>
                                <dd className="mt-1 text-sm tabular-nums font-bold text-gray-900 dark:text-slate-100">
                                    <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 inline-block">
                                        {item.sku || item.stock_no || 'N/A'}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Unit of Issue
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-slate-200 normal-case tabular-nums">
                                    {item.unit_of_issue || item.unit || '—'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Total On Hand
                                </dt>
                                <dd className="mt-1 text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                                    {formatNumber(item.on_hand ?? item.stock)}{' '}
                                    <span className="text-gray-500 dark:text-slate-400 text-sm font-normal font-sans">
                                        {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Inventory Value
                                </dt>
                                <dd className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-400 tabular-nums">
                                    {formatCurrency(item.inventory_value ?? item.amount)}
                                </dd>
                            </div>
                        </div>

                        {/* Item Name & Full Specifications */}
                        <div className="mt-3 grid grid-cols-1 gap-3">
                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Item Name
                                </dt>
                                <dd className="mt-0.5 text-base font-bold text-gray-900 dark:text-slate-100">
                                    {item.name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Specifications / Description
                                </dt>
                                <dd className="mt-0.5 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap bg-gray-50/50 dark:bg-slate-800/40 p-2.5 rounded border border-gray-100 dark:border-slate-800">
                                    {item.description || 'No detailed specifications or notes recorded.'}
                                </dd>
                            </div>

                            {item.rfid_tag ? (
                                <div>
                                    <dt className="text-sm font-semibold text-gray-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                        RFID Identification Tag
                                    </dt>
                                    <dd className="mt-0.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-sm tabular-nums font-semibold bg-red-950/5 dark:bg-red-950/40 text-red-950 dark:text-red-400 border border-red-900/10 dark:border-red-900/30">
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
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-red-900 dark:text-red-400" />
                                <h4 className="text-base font-bold text-gray-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                    Receiving History & Active Batches
                                </h4>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                                {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
                            </span>
                        </div>

                        {batches.length === 0 ? (
                            <div className="text-center py-6 px-4 bg-gray-50/50 dark:bg-slate-800/40 rounded-lg border border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400">
                                <p className="leading-relaxed text-sm font-medium">No separate receiving batches recorded yet.</p>
                                <p className="leading-relaxed text-sm text-gray-400 dark:text-slate-500 mt-1">
                                    Use the Receiving module to record incoming shipments from suppliers.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                                <table className="w-full min-w-[780px] text-left border-collapse">
                                    <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                                        <tr>
                                            <SortableTableHeader column="date" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} className="px-2 py-3">
                                                Date
                                            </SortableTableHeader>
                                            <SortableTableHeader column="supplier" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} className="px-2 py-3">
                                                Supplier
                                            </SortableTableHeader>
                                            <SortableTableHeader column="stock_no" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} className="px-2 py-3">
                                                Supplier Stock No.
                                            </SortableTableHeader>
                                            <SortableTableHeader column="received" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} align="right" className="px-2 py-3">
                                                Received
                                            </SortableTableHeader>
                                            <SortableTableHeader column="remaining" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} align="right" className="px-2 py-3">
                                                Remaining
                                            </SortableTableHeader>
                                            <SortableTableHeader column="cost" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} align="right" className="px-2 py-3">
                                                Unit Cost
                                            </SortableTableHeader>
                                            <SortableTableHeader column="value" activeColumn={batchSort.key} direction={batchSort.direction} onSort={sortBatches} align="right" className="px-2 py-3">
                                                Batch Value
                                            </SortableTableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                                        {batches.map((batch) => (
                                            <tr key={batch.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-1.5 sm:px-2 py-3 align-middle text-sm text-slate-600 dark:text-slate-400 tabular-nums truncate">
                                                    {formatDisplayDate(batch.date_received, 'short') || batch.date_received}
                                                </td>
                                                <td className="px-1.5 sm:px-2 py-3 align-middle text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={batch.supplier_name}>
                                                    {batch.supplier_name}
                                                </td>
                                                <td className="px-1.5 sm:px-2 py-3 align-middle">
                                                    {batch.supplier_stock_no ? (
                                                        <span
                                                            className="inline-block tabular-nums text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/70 dark:border-slate-700 truncate max-w-full align-middle"
                                                            title={batch.supplier_stock_no}
                                                        >
                                                            {batch.supplier_stock_no}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-1 sm:px-1.5 py-3 align-middle text-right tabular-nums text-sm tabular-nums text-slate-700 dark:text-slate-300 truncate">
                                                    {formatNumber(batch.quantity_received)}
                                                </td>
                                                <td className="px-1 sm:px-1.5 py-3 align-middle text-right tabular-nums text-sm tabular-nums truncate">
                                                    <span
                                                        className={
                                                            Number(batch.quantity_remaining) > 0
                                                                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                                                : 'text-slate-400 dark:text-slate-500'
                                                        }
                                                    >
                                                        {formatNumber(batch.quantity_remaining)}
                                                    </span>
                                                </td>
                                                <td className="px-1 sm:px-1.5 py-3 align-middle text-right tabular-nums text-sm tabular-nums text-slate-700 dark:text-slate-300 truncate">
                                                    {formatCurrency(batch.unit_cost)}
                                                </td>
                                                <td className="px-1.5 sm:px-2 py-3 align-middle text-right tabular-nums text-sm tabular-nums font-bold text-slate-900 dark:text-slate-100 truncate">
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
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                                <History className="w-4 h-4 text-red-900 dark:text-red-400" />
                                <h4 className="text-base font-bold text-gray-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                    Recent Issuance Allocations
                                </h4>
                            </div>

                            <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-800">
                                <table className="w-full min-w-[600px] text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                                        <tr>
                                            <SortableTableHeader column="date" activeColumn={issuanceSort.key} direction={issuanceSort.direction} onSort={sortIssuances} className="px-2 py-3">
                                                Date
                                            </SortableTableHeader>
                                            <SortableTableHeader column="reference" activeColumn={issuanceSort.key} direction={issuanceSort.direction} onSort={sortIssuances} className="px-2 py-3">
                                                RIS Reference
                                            </SortableTableHeader>
                                            <SortableTableHeader column="recipient" activeColumn={issuanceSort.key} direction={issuanceSort.direction} onSort={sortIssuances} className="px-2 py-3">
                                                Recipient / Office
                                            </SortableTableHeader>
                                            <SortableTableHeader column="quantity" activeColumn={issuanceSort.key} direction={issuanceSort.direction} onSort={sortIssuances} align="right" className="px-2 py-3">
                                                Quantity
                                            </SortableTableHeader>
                                            <SortableTableHeader column="value" activeColumn={issuanceSort.key} direction={issuanceSort.direction} onSort={sortIssuances} align="right" className="px-2 py-3">
                                                Issued Value
                                            </SortableTableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                                        {recentIssuances.map((iss) => (
                                            <tr key={iss.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                                                <td className="px-2 py-3 tabular-nums text-gray-600 dark:text-slate-400 truncate">
                                                    {formatDisplayDate(iss.date_issued, 'MM/DD/YYYY') || iss.date_issued}
                                                </td>
                                                <td className="px-2 py-3 tabular-nums font-semibold text-gray-800 dark:text-slate-200 truncate" title={iss.ris_number}>
                                                    {formatRisNumber(iss.ris_number)}
                                                </td>
                                                <td className="px-2 py-3 text-gray-700 dark:text-slate-300 truncate" title={iss.recipient}>
                                                    {iss.recipient}
                                                </td>
                                                <td className="px-1.5 py-3 text-right tabular-nums text-red-700 dark:text-red-400 font-semibold truncate">
                                                    -{formatNumber(iss.quantity)}
                                                </td>
                                                <td className="px-2 py-3 text-right tabular-nums font-bold text-gray-800 dark:text-slate-200 truncate">
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
                <div className="table-toolbar px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-center"
                    >
                        Close
                    </button>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                        {!readOnly && onDelete && can('inventory.destroy') && <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 sm:w-auto dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Item
                        </button>}
                        {!readOnly && can('rfid.view') && can('rfid.assign') && <Link
                            href={route('rfid-scanner.index', { item_id: item.id })}
                            className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                            <Tag className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                            <span>Tag RFID</span>
                        </Link>}

                        {!readOnly && can('inventory.update') && <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(item);
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Item Identity</span>
                        </button>}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
