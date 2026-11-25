import React, { useMemo } from 'react';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { InventoryAnalyticsItem } from '../types';

interface StockAttentionTableProps {
    items: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'amount'>>;
}

function formatCurrency(val: number): string {
    return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StockAttentionTable({ items }: StockAttentionTableProps) {
    type AttentionItem = StockAttentionTableProps['items'][number];
    const accessors = useMemo(() => ({
        name: (item: AttentionItem) => item.name,
        stock: (item: AttentionItem) => item.stock,
        unit: (item: AttentionItem) => item.unitOfIssue,
        status: (item: AttentionItem) => Number(item.stock) <= 0 ? 'Critical / Out of Stock' : 'Low Stock',
        value: (item: AttentionItem) => item.amount,
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData(items, accessors, { key: 'stock', direction: 'asc' });
    const hasItems = items && items.length > 0;

    return (
        <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Stock Requiring Attention
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Inventory items reaching or below safety replenishment thresholds
                    </CardDescription>
                </div>
                {hasItems && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-sm font-semibold text-amber-900 dark:text-amber-300 self-start sm:self-auto">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{items.length} {items.length === 1 ? 'item' : 'items'} need replenishment</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {hasItems ? (
                    <div className="w-full min-w-0 overflow-x-auto">
                        <Table className="min-w-[40.625rem]">
                            <TableHeader>
                                <TableRow className="bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                                    <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="pl-6 py-3.5 align-middle">Item Name & SKU</SortableTableHeader>
                                    <SortableTableHeader column="stock" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-4 py-3.5 align-middle">Stock On Hand</SortableTableHeader>
                                    <SortableTableHeader column="unit" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="center" className="px-4 py-3.5 align-middle">Unit of Issue</SortableTableHeader>
                                    <SortableTableHeader column="status" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="center" className="px-4 py-3.5 align-middle">Status</SortableTableHeader>
                                    <SortableTableHeader column="value" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="pr-6 py-3.5 align-middle">Calculated Value</SortableTableHeader>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedRows.map((item) => {
                                    const isOut = Number(item.stock) <= 0;
                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                            <TableCell className="pl-6 py-3.5 align-middle">
                                                <div>
                                                    <p className="leading-relaxed font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.name}</p>
                                                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 tabular-nums">SKU: {item.sku || 'N/A'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-3.5 font-semibold tabular-nums text-sm text-slate-900 dark:text-slate-100 align-middle">
                                                {Number(item.stock).toLocaleString('en-PH')}
                                            </TableCell>
                                            <TableCell className="text-center py-3.5 text-sm text-slate-600 dark:text-slate-400 align-middle">
                                                {item.unitOfIssue || 'Units'}
                                            </TableCell>
                                            <TableCell className="text-center py-3.5 align-middle">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${isOut
    ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40" : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"}`}
                                                >
                                                    {isOut ? 'Critical / Out of Stock' : 'Low Stock'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-3.5 tabular-nums text-sm text-slate-700 dark:text-slate-300 align-middle">
                                                {formatCurrency(Number(item.amount || 0))}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">All Stock Levels Normal</h4>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                            No inventory items are currently at or below safety replenishment levels.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
