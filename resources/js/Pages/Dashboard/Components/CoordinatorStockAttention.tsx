import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useSortableData } from '@/Hooks/useSortableData';
import RecordTable from '@/Components/ui/record-table';
import type { CriticalStockItem } from '../types';

declare function route(name: string, params?: any): string;

const rowKey = (item: CriticalStockItem) => item.id ?? item.item_id ?? item.sku;

export default function CoordinatorStockAttention({ items, canRequest }: { items: CriticalStockItem[]; canRequest: boolean }) {
    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'Item',
            value: (item: CriticalStockItem) => item.name,
            render: (item: CriticalStockItem) => (
                <>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{item.sku}</p>
                </>
            ),
        },
        {
            key: 'current',
            label: 'On hand',
            value: (item: CriticalStockItem) => item.current,
            render: (item: CriticalStockItem) => `${item.current} ${item.unit}`,
            align: 'right' as const,
        },
        {
            key: 'min',
            label: 'Minimum',
            value: (item: CriticalStockItem) => item.min,
            render: (item: CriticalStockItem) => `${item.min} ${item.unit}`,
            align: 'right' as const,
        },
        {
            key: 'status',
            label: 'Status',
            value: (item: CriticalStockItem) => item.status || item.priority,
            render: (item: CriticalStockItem) => (
                <span className={`whitespace-nowrap rounded-md px-2 py-1 font-medium ${item.current <= 0 || item.priority === 'Critical' ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                    {item.status || 'Low stock'}
                </span>
            ),
        },
        ...(canRequest ? [{
            key: 'action',
            label: 'Action',
            value: () => '',
            align: 'right' as const,
            render: (item: CriticalStockItem) => (
                <Link
                    href={route('inventory.requests.index', { create: 1, ...(item.item_id ? { item_id: item.item_id } : {}) })}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-900 text-white hover:bg-red-950 transition-colors shadow-2xs"
                >
                    Request
                </Link>
            ),
        }] : []),
    ], [canRequest]);

    const accessors = useMemo(() => Object.fromEntries(columns.map(column => [column.key, column.value])), [columns]);
    const { sortedRows, sort, requestSort } = useSortableData(items, accessors, { key: 'current', direction: 'asc' });
    const visible = sortedRows.slice(0, 4);

    return (
        <RecordTable rows={visible} columns={columns} rowKey={rowKey} sort={sort} onSort={requestSort} className="min-w-[530px] text-xs" />
    );
}
