import React from 'react';
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
    const hasItems = items && items.length > 0;

    return (
        <Card>
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <CardTitle className="text-sm font-bold text-gray-900 font-serif">
                        Stock Requiring Attention
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                        Inventory items reaching or below safety replenishment thresholds
                    </CardDescription>
                </div>
                {hasItems && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900 self-start sm:self-auto">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>{items.length} {items.length === 1 ? 'item' : 'items'} need replenishment</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {hasItems ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                                    <TableHead className="w-[40%] pl-6">Item Name & SKU</TableHead>
                                    <TableHead className="text-right">Stock On Hand</TableHead>
                                    <TableHead className="text-center">Unit of Issue</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right pr-6">Calculated Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const isOut = Number(item.stock) <= 0;
                                    return (
                                        <TableRow key={item.id} className="hover:bg-gray-50/80">
                                            <TableCell className="pl-6 py-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">{item.name}</p>
                                                    <p className="text-[11px] text-gray-500 font-mono">SKU: {item.sku || 'N/A'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-3 font-semibold font-mono text-xs text-gray-900">
                                                {Number(item.stock).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center py-3 text-xs text-gray-600">
                                                {item.unitOfIssue || 'Units'}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        isOut
                                                            ? 'bg-red-50 text-red-800 border border-red-200'
                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                                >
                                                    {isOut ? 'Critical / Out of Stock' : 'Low Stock'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-3 font-mono text-xs text-gray-700">
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
                        <h4 className="text-xs font-semibold text-gray-900">All Stock Levels Normal</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm">
                            No inventory items are currently at or below safety replenishment levels.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
