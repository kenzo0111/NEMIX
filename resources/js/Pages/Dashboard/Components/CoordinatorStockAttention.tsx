import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useSortableData } from '@/Hooks/useSortableData';
import { useTableSelection } from '@/Hooks/useTableSelection';
import RecordTable from '@/Components/ui/record-table';
import RecordDetailsModal from '@/Components/ui/record-details-modal';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import type { CriticalStockItem } from '../types';

const rowKey = (item: CriticalStockItem) => item.id ?? item.item_id ?? item.sku;

export default function CoordinatorStockAttention({ items, canRequest }: { items: CriticalStockItem[]; canRequest: boolean }) {
    const columns = useMemo(() => [
        { key: 'name', label: 'Item', value: (item: CriticalStockItem) => item.name, render: (item: CriticalStockItem) => <><p className="font-semibold">{item.name}</p><p className="mt-1 text-slate-500 dark:text-slate-400">{item.sku}</p></> },
        { key: 'current', label: 'On hand', value: (item: CriticalStockItem) => item.current, render: (item: CriticalStockItem) => `${item.current} ${item.unit}`, align: 'right' as const },
        { key: 'min', label: 'Minimum', value: (item: CriticalStockItem) => item.min, render: (item: CriticalStockItem) => `${item.min} ${item.unit}`, align: 'right' as const },
        { key: 'status', label: 'Status', value: (item: CriticalStockItem) => item.status || item.priority, render: (item: CriticalStockItem) => <span className={`whitespace-nowrap rounded-md px-2 py-1 font-medium ${item.current <= 0 || item.priority === 'Critical' ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>{item.status || 'Low stock'}</span> },
    ], []);
    const accessors = useMemo(() => Object.fromEntries(columns.map(column => [column.key, column.value])), [columns]);
    const { sortedRows, sort, requestSort } = useSortableData(items, accessors, { key: 'current', direction: 'asc' });
    const visible = sortedRows.slice(0, 4);
    const { selectedKey, selectedRow, selectRow } = useTableSelection(visible, rowKey);
    const [showDetails, setShowDetails] = useState(false);

    return <>
        <TableSelectionAction selectedLabel={selectedRow?.name} actionLabel="View selected" onAction={() => setShowDetails(true)} />
        <RecordTable rows={visible} columns={columns} rowKey={rowKey} sort={sort} onSort={requestSort} selectedKey={selectedKey} onSelect={selectRow} className="min-w-[530px] text-xs" />
        <RecordDetailsModal show={showDetails && !!selectedRow} title="Stock requiring attention" onClose={() => setShowDetails(false)} actions={selectedRow && canRequest && <Link href={route('inventory.requests.index', { create: 1, ...(selectedRow.item_id ? { item_id: selectedRow.item_id } : {}) })} className="table-control inline-flex items-center rounded-lg bg-red-900 px-4 text-sm font-semibold text-white hover:bg-red-800">Request replenishment</Link>}>
            {selectedRow && <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[
                ['Item', selectedRow.name], ['Stock number', selectedRow.sku], ['On hand', `${selectedRow.current} ${selectedRow.unit}`], ['Minimum', `${selectedRow.min} ${selectedRow.unit}`], ['Status', selectedRow.status || selectedRow.priority],
            ].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>}
        </RecordDetailsModal>
    </>;
}
