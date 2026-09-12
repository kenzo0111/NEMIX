import React from 'react';
import Modal from '@/Components/Modal';
import { ExternalLink, X, Package } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { InventoryAnalyticsItem } from '../types';

interface FocusedItemsModalProps {
    show: boolean;
    onClose: () => void;
    items: InventoryAnalyticsItem[];
}

function formatCurrency(val: number): string {
    return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FocusedItemsModal({
    show,
    onClose,
    items,
}: FocusedItemsModalProps) {
    const handleNavigateToInventory = () => {
        if (typeof route === 'function') {
            try {
                window.location.href = route('inventory.index');
                return;
            } catch (e) {
                // fallback
            }
        }
        window.location.href = '/inventory/items';
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-lg bg-white shadow-xl border border-gray-200">
                {/* Institutional Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded bg-red-950 text-amber-300 border border-red-900 shrink-0">
                            <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif truncate">
                                Inventory Analytics Drill-Down
                            </h3>
                            <p className="text-[11px] text-gray-500 truncate">
                                Compact snapshot of registered stock items and valuation
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                            type="button"
                            onClick={handleNavigateToInventory}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                            <span className="hidden sm:inline">Full</span> Inventory Registry
                            <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <span>Showing {items.length} registered items</span>
                        <span className="text-gray-400 font-mono">Sorted by latest records</span>
                    </div>

                    {items.length > 0 ? (
                        <div className="border border-gray-200 rounded-md overflow-x-auto">
                            <Table className="min-w-[580px]">
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80">
                                        <TableHead className="w-[45%]">Item / SKU</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Total Value</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-gray-50/60">
                                            <TableCell className="py-2.5">
                                                <p className="font-semibold text-gray-900 text-xs truncate max-w-[200px]">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-mono">
                                                    {item.sku || 'No SKU'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right py-2.5 font-mono text-xs font-semibold text-gray-900">
                                                {Number(item.stock).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right py-2.5 font-mono text-xs text-gray-600">
                                                {formatCurrency(Number(item.unitCost || 0))}
                                            </TableCell>
                                            <TableCell className="text-right py-2.5 font-mono text-xs font-semibold text-gray-900">
                                                {formatCurrency(Number(item.amount || 0))}
                                            </TableCell>
                                            <TableCell className="text-center py-2.5">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        item.status === 'Available'
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                            : item.status === 'Low Stock'
                                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                            : 'bg-red-50 text-red-800 border border-red-200'
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-xs text-gray-500">
                            No inventory records available.
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
