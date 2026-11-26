import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useSortableData } from '@/Hooks/useSortableData';
import RecordTable from '@/Components/ui/record-table';
import { actionLinkProps } from '@/Components/ui/button';
import StatusBadge from '@/Components/ui/status-badge';
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
                <StatusBadge tone={item.current <= 0 || item.priority === 'Critical' ? 'danger' : 'warning'}>
                    {item.status || 'Low stock'}
                </StatusBadge>
            ),
        },
        ...(canRequest ? [{
            key: 'action',
            label: 'Action',
            value: () => '',
            align: 'right' as const,
            render: (item: CriticalStockItem) => (
                <Link
                    {...actionLinkProps('primary', 'sm')}
                    href={route('inventory.requests.index', { create: 1, ...(item.item_id ? { item_id: item.item_id } : {}) })}
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
        <RecordTable rows={visible} columns={columns} rowKey={rowKey} sort={sort} onSort={requestSort} className="min-w-[530px] text-sm" />
    );
}
