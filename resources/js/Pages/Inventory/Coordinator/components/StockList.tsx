import React, { useMemo, useState } from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import { Stock, money, secondaryButton, stockStatus } from '../inventory';
import { useSortableData } from '@/Hooks/useSortableData';
import { useTableSelection, cardSelectionProps } from '@/Hooks/useTableSelection';
import RecordTable, { type RecordColumn } from '@/Components/ui/record-table';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import TableSortControls from '@/Components/ui/table-sort-controls';
import RecordDetailsModal from '@/Components/ui/record-details-modal';

type StockSortKey = 'name' | 'sku' | 'quantity' | 'status' | 'value';
interface Props {
    stocks: Stock[]; lowStockThreshold: number;
    onIssue: (stock: Stock) => void; onStockCard: (stock: Stock) => void;
    canIssue?: boolean; canStockCard?: boolean;
}

export default function StockList({ stocks, lowStockThreshold, onIssue, onStockCard, canIssue = false, canStockCard = false }: Props) {
    const accessors = useMemo(() => ({
        name: (stock: Stock) => stock.name, sku: (stock: Stock) => stock.sku,
        quantity: (stock: Stock) => stock.quantity, value: (stock: Stock) => Number(stock.value),
        status: (stock: Stock) => stockStatus(stock.quantity, lowStockThreshold).label,
    }), [lowStockThreshold]);
    const { sortedRows, sort, requestSort } = useSortableData<Stock, StockSortKey>(stocks, accessors, { key: 'name', direction: 'asc' });
    const { selectedKey, selectedRow, selectRow } = useTableSelection(stocks, stock => stock.id);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const badge = (stock: Stock) => {
        const status = stockStatus(stock.quantity, lowStockThreshold);
        return <span className={'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ' + status.classes}>{status.label}</span>;
    };
    const columns: RecordColumn<Stock, StockSortKey>[] = [
        { key: 'name', label: 'Item / Stock No.', value: accessors.name, render: stock => <><p className="font-semibold text-slate-900 dark:text-slate-100">{stock.name}</p><p className="mt-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">{stock.sku}</p></> },
        { key: 'quantity', label: 'On hand', value: accessors.quantity, render: stock => <span className="whitespace-nowrap"><strong className="tabular-nums">{stock.quantity.toLocaleString()}</strong> {stock.unit}</span> },
        { key: 'status', label: 'Status', value: accessors.status, render: badge },
        { key: 'value', label: 'Stock value', value: accessors.value, align: 'right', render: stock => money(Number(stock.value)) },
    ];
    return <>
        <TableSelectionAction selectedLabel={selectedRow?.name} actionLabel={canIssue || canStockCard ? 'Manage selected' : 'View selected'} onAction={() => setDetailsOpen(true)}>
            <TableSortControls options={[{ value: 'name', label: 'Item' }, { value: 'sku', label: 'Stock No.' }, { value: 'quantity', label: 'On hand' }, { value: 'status', label: 'Status' }, { value: 'value', label: 'Stock value' }]} sortKey={sort.key} direction={sort.direction} onSort={requestSort} className="sm:hidden" />
        </TableSelectionAction>
        <RecordTable rows={sortedRows} columns={columns} rowKey={stock => stock.id} sort={sort} onSort={requestSort} selectedKey={selectedKey} onSelect={selectRow} className="min-w-[640px]" containerClassName="hidden sm:block" />
        <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
            {sortedRows.map(stock => <article key={stock.id} {...cardSelectionProps(selectedKey === stock.id, () => selectRow(stock))} aria-label={'Select ' + stock.name} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{stock.name}</h3><p className="mt-1 break-all text-sm tabular-nums text-slate-500 dark:text-slate-400">{stock.sku}</p></div>{badge(stock)}</div>
                <div className="flex justify-between gap-3 text-sm"><span><strong className="tabular-nums">{stock.quantity.toLocaleString()}</strong> {stock.unit} on hand</span><strong className="tabular-nums">{money(Number(stock.value))}</strong></div>
            </article>)}
        </div>
        <RecordDetailsModal show={detailsOpen && Boolean(selectedRow)} title="Supply stock details" description={selectedRow?.name} onClose={() => setDetailsOpen(false)} actions={selectedRow && <>
            {canStockCard && <button type="button" onClick={() => { setDetailsOpen(false); onStockCard(selectedRow); }} className={secondaryButton}><FileText size={16} />Stock Card</button>}
            {canIssue && <button type="button" disabled={selectedRow.quantity <= 0} onClick={() => { setDetailsOpen(false); onIssue(selectedRow); }} className="inline-flex items-center gap-2 rounded-lg bg-red-900 px-4 text-sm font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800"><ArrowUpRight size={16} />Record an Issue</button>}
        </>}>
            {selectedRow && <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {[['Item', selectedRow.name], ['Stock No.', selectedRow.sku], ['On hand', selectedRow.quantity.toLocaleString() + ' ' + selectedRow.unit], ['Stock value', money(Number(selectedRow.value))], ['Status', stockStatus(selectedRow.quantity, lowStockThreshold).label]].map(([label, value]) => <div key={label}><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
            </dl>}
        </RecordDetailsModal>
    </>;
}

