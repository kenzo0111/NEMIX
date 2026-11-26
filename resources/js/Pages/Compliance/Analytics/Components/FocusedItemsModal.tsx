import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
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
    const accessors = useMemo(() => ({
        name: (item: InventoryAnalyticsItem) => item.name,
        stock: (item: InventoryAnalyticsItem) => item.stock,
        cost: (item: InventoryAnalyticsItem) => item.unitCost,
        value: (item: InventoryAnalyticsItem) => item.amount,
        status: (item: InventoryAnalyticsItem) => item.status,
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData(items, accessors, { key: 'name', direction: 'asc' });
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
        <Modal show={show} onClose={onClose} maxWidth="3xl" ariaLabel="Inventory Analytics Drill-Down">
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Institutional Header */}
            <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded bg-red-950 text-amber-300 border border-red-900 shrink-0">
                            <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                                Inventory Analytics Drill-Down
                            </h3>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 break-words">
                                Compact snapshot of registered stock items and valuation
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <Button variant="secondary"
                            type="button"
                            onClick={handleNavigateToInventory}
                            className="inline-flex items-center gap-1.5"
                        >
                            <span className="hidden sm:inline">Full</span> Inventory Registry
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                            type="button"
                            onClick={onClose}
                            className=""
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content */}
                <DialogBody className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Showing {items.length} registered items</span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">Select a column heading to sort</span>
                    </div>

                    {items.length > 0 ? (
                        <div className="w-full min-w-0 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                            <Table className="min-w-[36.25rem]">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                                        <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-4 py-3.5 align-middle">Item / SKU</SortableTableHeader>
                                        <SortableTableHeader column="stock" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-4 py-3.5 align-middle">Stock</SortableTableHeader>
                                        <SortableTableHeader column="cost" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-4 py-3.5 align-middle">Unit Cost</SortableTableHeader>
                                        <SortableTableHeader column="value" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-4 py-3.5 align-middle">Total Value</SortableTableHeader>
                                        <SortableTableHeader column="status" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="center" className="px-4 py-3.5 align-middle">Status</SortableTableHeader>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedRows.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                                            <TableCell className="py-3.5 align-middle">
                                                <p className="leading-relaxed font-semibold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[200px]">
                                                    {item.name}
                                                </p>
                                                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                                    {item.sku || 'No SKU'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right py-3.5 tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                                {Number(item.stock).toLocaleString('en-PH')}
                                            </TableCell>
                                            <TableCell className="text-right py-3.5 tabular-nums text-sm text-slate-600 dark:text-slate-400 align-middle">
                                                {formatCurrency(Number(item.unitCost || 0))}
                                            </TableCell>
                                            <TableCell className="text-right py-3.5 tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                                {formatCurrency(Number(item.amount || 0))}
                                            </TableCell>
                                            <TableCell className="text-center py-3.5 align-middle">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${item.status === 'Available'
    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40" : item.status === 'Low Stock'
    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40" : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40"}`}
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
                        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No inventory records available.
                        </div>
                    )}
                </DialogBody>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
        </Modal>
    );
}
