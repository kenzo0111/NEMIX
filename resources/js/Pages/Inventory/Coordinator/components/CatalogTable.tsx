import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { useTableSelection, cardSelectionProps } from '@/Hooks/useTableSelection';
import type { SortState } from '@/Hooks/useSortableData';
import RecordTable, { type RecordColumn } from '@/Components/ui/record-table';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import TableSortControls from '@/Components/ui/table-sort-controls';
import RecordDetailsModal from '@/Components/ui/record-details-modal';
import type { CatalogItem, CatalogSortKey } from '../catalog';
import { panel } from '../inventory';

export default function CatalogTable({ items, sort, onSort }: { items: CatalogItem[]; sort: SortState<CatalogSortKey>; onSort: (key: CatalogSortKey) => void }) {
    const { can } = useAuthorization();
    const { selectedKey, selectedRow, selectRow } = useTableSelection(items, item => item.id);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const columns: RecordColumn<CatalogItem, CatalogSortKey>[] = [
        { key: 'sku', label: 'Stock No.', value: item => item.sku, className: 'tabular-nums' },
        { key: 'name', label: 'Item', value: item => item.name, render: item => <><p className="font-semibold">{item.name}</p><p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{item.description}</p></> },
        { key: 'unit', label: 'Unit', value: item => item.unit },
        { key: 'on_hand', label: 'In Supply Office', value: item => item.on_hand, align: 'right', render: item => item.on_hand.toLocaleString() },
        { key: 'available', label: 'Available to request', value: item => item.available_quantity, align: 'right', render: item => <strong className="text-red-900 dark:text-red-300">{item.available_quantity.toLocaleString()}</strong> },
    ];
    const eligible = Boolean(selectedRow && selectedRow.available_quantity > 0 && (selectedRow.quota_remaining ?? 0) > 0);
    return <section data-tour="coordinator-catalog-items" aria-label="Central consumable items" className={panel + ' overflow-hidden'}>
        <TableSelectionAction selectedLabel={selectedRow?.name} actionLabel="View selected" onAction={() => setDetailsOpen(true)}>
            <TableSortControls options={[{ value: 'name', label: 'Item' }, { value: 'sku', label: 'Stock No.' }, { value: 'unit', label: 'Unit' }, { value: 'on_hand', label: 'In Supply Office' }, { value: 'available', label: 'Available to request' }]} sortKey={sort.key} direction={sort.direction} onSort={onSort} className="lg:hidden" label="Sort central supplies by" />
        </TableSelectionAction>
        <RecordTable rows={items} columns={columns} rowKey={item => item.id} sort={sort} onSort={onSort} selectedKey={selectedKey} onSelect={selectRow} className="min-w-[760px]" containerClassName="hidden lg:block" />
        <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
            {items.map(item => <article key={item.id} {...cardSelectionProps(selectedKey === item.id, () => selectRow(item))} aria-label={'Select ' + item.name} className="space-y-3 p-4 sm:p-5">
                <h3 className="text-lg font-semibold">{item.name}</h3><p className="break-all text-sm tabular-nums text-slate-500 dark:text-slate-400">{item.sku}</p>
                {item.description && <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
                <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500 dark:text-slate-400">In Supply Office</dt><dd className="mt-1 font-semibold tabular-nums">{item.on_hand.toLocaleString()} {item.unit}</dd></div><div><dt className="text-slate-500 dark:text-slate-400">Available to request</dt><dd className="mt-1 font-semibold tabular-nums text-red-900 dark:text-red-300">{item.available_quantity.toLocaleString()} {item.unit}</dd></div></dl>
            </article>)}
        </div>
        <RecordDetailsModal show={detailsOpen && Boolean(selectedRow)} title="Central supply details" description={selectedRow?.name} onClose={() => setDetailsOpen(false)} actions={selectedRow && can('inventory.requests.store') && eligible && <Link data-toolbar-action href={route('inventory.requests.index', { create: 1, item_id: selectedRow.id })} className="table-control inline-flex items-center gap-2 rounded-lg bg-red-900 px-4 text-sm font-semibold text-white hover:bg-red-950">Request This Item<ArrowRight size={15} /></Link>}>
            {selectedRow && <>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                        ['Stock No.', selectedRow.sku], ['Unit', selectedRow.unit || 'units'],
                        ['In Supply Office', selectedRow.on_hand.toLocaleString()], ['Available to request', selectedRow.available_quantity.toLocaleString()],
                        ['Weekly limit', selectedRow.weekly_request_limit == null ? 'Not configured' : String(selectedRow.weekly_request_limit)], ['Weekly allowance remaining', String(selectedRow.quota_remaining ?? 0)],
                    ].map(([label, value]) => <div key={label}><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
                </dl>
                {selectedRow.description && <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">{selectedRow.description}</p>}
                {!eligible && <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedRow.weekly_request_limit == null ? 'Weekly limit not configured' : (selectedRow.quota_remaining ?? 0) === 0 ? 'Weekly allowance used' : selectedRow.on_hand > 0 ? 'Minimum stock or reservations protected' : 'Awaiting replenishment'}</p>}
            </>}
        </RecordDetailsModal>
    </section>;
}
