import React, { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { Movement, displayDate, secondaryButton } from '../inventory';
import { useTableSelection } from '@/Hooks/useTableSelection';
import type { SortDirection } from '@/Hooks/useSortableData';
import RecordTable, { type RecordColumn } from '@/Components/ui/record-table';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import TableSortControls from '@/Components/ui/table-sort-controls';
import RecordDetailsModal from '@/Components/ui/record-details-modal';

export interface MovementPage { data: Movement[]; from: number | null; to: number | null; total: number; links: { url: string | null; label: string; active: boolean }[]; }
type HistorySortKey = 'date' | 'item' | 'type' | 'quantity' | 'source';
export interface HistoryFilters { search?: string; type?: string; sort?: HistorySortKey; direction?: SortDirection; }

export default function TransactionHistory({ movements, filters = {} }: { movements: MovementPage; filters?: HistoryFilters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [sortKey, setSortKey] = useState<HistorySortKey>(filters.sort || 'date');
    const [direction, setDirection] = useState<SortDirection>(filters.direction || 'desc');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { selectedKey, selectedRow, selectRow } = useTableSelection(movements.data, movement => movement.id);
    useEffect(() => { setSearch(filters.search || ''); setType(filters.type || 'all'); setSortKey(filters.sort || 'date'); setDirection(filters.direction || 'desc'); }, [filters.search, filters.type, filters.sort, filters.direction]);
    const load = (query: string, movementType: string, nextSort = sortKey, nextDirection = direction) => router.get(route('coordinator.inventory.index'), {
        tab: 'history', search: query.trim(), type: movementType, sort: nextSort, direction: nextDirection, page: 1,
    }, { preserveState: true, preserveScroll: true, replace: true });
    const onSort = (key: HistorySortKey) => {
        const nextDirection = key === sortKey && direction === 'asc' ? 'desc' : 'asc';
        setSortKey(key); setDirection(nextDirection); load(search, type, key, nextDirection);
    };
    const columns: RecordColumn<Movement, HistorySortKey>[] = [
        { key: 'date', label: 'Date', value: movement => new Date(movement.date), render: movement => displayDate(movement.date), className: 'whitespace-nowrap' },
        { key: 'item', label: 'Item / Reference', value: movement => movement.stock.name, render: movement => <><p className="font-semibold">{movement.stock.name}</p><p className="mt-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">{movement.reference}</p></> },
        { key: 'type', label: 'Movement', value: movement => movement.type, render: movement => <span className={'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ' + (movement.type === 'receipt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300')}>{movement.type === 'receipt' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}{movement.type === 'receipt' ? 'Received' : 'Issued'}</span> },
        { key: 'quantity', label: 'Quantity', value: movement => movement.quantity, align: 'right', render: movement => <span className="whitespace-nowrap font-semibold">{movement.type === 'receipt' ? '+' : '−'}{movement.quantity} <span className="font-normal text-slate-500 dark:text-slate-400">{movement.stock.unit}</span></span> },
        { key: 'source', label: 'Source / Recipient', value: movement => movement.type === 'receipt' ? 'Supply Office' : movement.office },
    ];
    return <>
        <div className="px-4 py-5 sm:px-6"><h2 className="text-xl font-semibold">My Transaction History</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Receipts and distributions belonging to your account.</p></div>
        <form className="table-toolbar flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 dark:border-slate-800" onSubmit={event => { event.preventDefault(); load(search, type); }}>
            <div className="relative min-w-0 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" aria-label="Search transaction history" placeholder="Search item, reference, or recipient…" value={search} onChange={event => setSearch(event.target.value)} maxLength={150} className="table-control w-full rounded-lg border-slate-300 pl-9 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-700 dark:bg-slate-950" /></div>
            <select aria-label="Filter transaction movement" value={type} onChange={event => { setType(event.target.value); load(search, event.target.value); }} className="table-control rounded-lg border-slate-300 pl-3 pr-8 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-700 dark:bg-slate-950"><option value="all">All movements</option><option value="receipt">Received</option><option value="issue">Issued</option></select>
            <button className={secondaryButton} type="submit">Search</button>
            {(search || type !== 'all') && <button className={secondaryButton} type="button" onClick={() => { setSearch(''); setType('all'); load('', 'all'); }}>Reset</button>}
        </form>
        <TableSelectionAction selectedLabel={selectedRow ? selectedRow.stock.name + ' (' + selectedRow.reference + ')' : null} actionLabel="View selected" onAction={() => setDetailsOpen(true)}>
            <TableSortControls options={[{ value: 'date', label: 'Date' }, { value: 'item', label: 'Item' }, { value: 'type', label: 'Movement' }, { value: 'quantity', label: 'Quantity' }, { value: 'source', label: 'Source / Recipient' }]} sortKey={sortKey} direction={direction} onSort={onSort} className="sm:hidden" />
        </TableSelectionAction>
        <RecordTable rows={movements.data} columns={columns} rowKey={movement => movement.id} sort={{ key: sortKey, direction }} onSort={onSort} selectedKey={selectedKey} onSelect={selectRow} className="min-w-[700px]" emptyMessage="Your receipts and distributions will appear here." />
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-slate-800"><p className="text-sm text-slate-500 dark:text-slate-400">Showing {movements.from ?? 0}–{movements.to ?? 0} of {movements.total} transactions</p><nav aria-label="Transaction pages" className="flex flex-wrap gap-1.5">{movements.links.map((link, i) => link.url ? <Link key={i} href={link.url} preserveScroll preserveState aria-current={link.active ? 'page' : undefined} className={'table-control inline-flex min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium ' + (link.active ? 'bg-red-900 text-white' : 'border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800')} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={i} className="table-control inline-flex items-center px-3 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav></div>
        <RecordDetailsModal show={detailsOpen && Boolean(selectedRow)} title="Transaction details" description={selectedRow?.reference} onClose={() => setDetailsOpen(false)}>
            {selectedRow && <dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Date', displayDate(selectedRow.date)], ['Item', selectedRow.stock.name], ['Stock No.', selectedRow.stock.sku], ['Reference', selectedRow.reference], ['Movement', selectedRow.type === 'receipt' ? 'Received' : 'Issued'], ['Quantity', String(selectedRow.quantity) + ' ' + selectedRow.stock.unit], ['Source / Recipient', selectedRow.type === 'receipt' ? 'Supply Office' : selectedRow.office]].map(([label, value]) => <div key={label}><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>}
        </RecordDetailsModal>
    </>;
}

