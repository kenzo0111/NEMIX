import React, { useMemo } from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import { Stock, money, secondaryButton, stockStatus } from '../inventory';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type StockSortKey = 'name' | 'sku' | 'quantity' | 'status' | 'value';

interface Props {
    stocks: Stock[];
    lowStockThreshold: number;
    onIssue: (stock: Stock) => void;
    onStockCard: (stock: Stock) => void;
    canIssue?: boolean;
    canStockCard?: boolean;
}

export default function StockList({
    stocks,
    lowStockThreshold,
    onIssue,
    onStockCard,
    canIssue = false,
    canStockCard = false,
}: Props) {
    const accessors = useMemo(() => ({
        name: (stock: Stock) => stock.name,
        sku: (stock: Stock) => stock.sku,
        quantity: (stock: Stock) => stock.quantity,
        value: (stock: Stock) => Number(stock.value),
        status: (stock: Stock) => stockStatus(stock.quantity, lowStockThreshold).label,
    }), [lowStockThreshold]);

    const { sortedRows, sort, requestSort } = useSortableData<Stock, StockSortKey>(stocks, accessors, { key: 'name', direction: 'asc' });
    const hasActions = canIssue || canStockCard;

    const actions = (stock: Stock) => hasActions ? (
        <div className="inline-flex items-center justify-end gap-2 flex-wrap">
            {canIssue && (
                <button
                    type="button"
                    onClick={() => onIssue(stock)}
                    disabled={stock.quantity <= 0}
                    aria-label={`Record issue for ${stock.name}`}
                    className="inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors whitespace-nowrap cursor-pointer"
                >
                    <ArrowUpRight size={14} />
                    Record Issue
                </button>
            )}
            {canStockCard && (
                <button
                    type="button"
                    onClick={() => onStockCard(stock)}
                    aria-label={`Generate Stock Card for ${stock.name}`}
                    className="inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-red-900 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-red-300 dark:hover:bg-red-950/50 cursor-pointer"
                >
                    <FileText size={14} />
                    Stock Card
                </button>
            )}
        </div>
    ) : null;

    return (
        <>
            <div className="hidden overflow-x-auto sm:block w-full min-w-0">
                <table className="w-full text-left text-sm min-w-[48rem] border-collapse">
                    <thead className="bg-slate-50 text-sm normal-case tracking-normal text-slate-500 dark:bg-slate-950/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 pl-6 font-semibold min-w-[12.5rem]">
                                Item / Stock No.
                            </SortableTableHeader>
                            <SortableTableHeader column="quantity" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-semibold">
                                On hand
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-semibold">
                                Status
                            </SortableTableHeader>
                            <SortableTableHeader column="value" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="whitespace-nowrap px-4 py-3.5 font-semibold">
                                Stock value
                            </SortableTableHeader>
                            {hasActions && (
                                <th scope="col" className="whitespace-nowrap px-4 py-3.5 pr-6 font-semibold text-right min-w-[10rem]">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedRows.map(stock => {
                            const status = stockStatus(stock.quantity, lowStockThreshold);
                            return (
                                <tr key={stock.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                    <th scope="row" className="min-w-52 py-3.5 pl-6 pr-4 align-middle font-normal text-left">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{stock.name}</p>
                                        <p className="leading-relaxed mt-0.5 tabular-nums text-sm text-slate-500 dark:text-slate-400">{stock.sku}</p>
                                    </th>
                                    <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                                        <span className="font-semibold tabular-nums">{stock.quantity.toLocaleString()}</span>
                                        <span className="ml-1.5 text-sm text-slate-500 dark:text-slate-400">{stock.unit}</span>
                                    </td>
                                    <td className="px-4 py-3.5 align-middle">
                                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ${status.classes}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right tabular-nums text-slate-700 dark:text-slate-300">
                                        {money(Number(stock.value))}
                                    </td>
                                    {hasActions && (
                                        <td className="whitespace-nowrap py-3.5 pl-4 pr-6 align-middle text-right min-w-[10rem]">
                                            <div className="flex justify-end">{actions(stock)}</div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
                {sortedRows.map(stock => {
                    const status = stockStatus(stock.quantity, lowStockThreshold);
                    return (
                        <article key={stock.id} className="space-y-4 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-xl font-semibold">{stock.name}</h2>
                                    <p className="leading-relaxed mt-1 break-all tabular-nums text-sm text-slate-500 dark:text-slate-400">{stock.sku}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-1 text-sm font-medium ${status.classes}`}>
                                    {status.label}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>
                                    <strong className="text-lg tabular-nums">{stock.quantity}</strong>{' '}
                                    <span className="text-slate-500 dark:text-slate-400">{stock.unit} on hand</span>
                                </span>
                                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                                    {money(Number(stock.value))}
                                </span>
                            </div>
                            {actions(stock)}
                        </article>
                    );
                })}
            </div>
        </>
    );
}
