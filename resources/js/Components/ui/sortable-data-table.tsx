import React, { useMemo } from 'react';
import { useSortableData, type SortState } from '@/Hooks/useSortableData';
import RecordTable, { type RecordColumn, type RecordTableProps } from './record-table';

export type SortableColumn<T> = RecordColumn<T>;

interface Props<T> extends Omit<RecordTableProps<T>, 'sort' | 'onSort'> {
    initialSort?: SortState;
}

/** Sorts the complete supplied dataset. Paginated pages use RecordTable. */
export default function SortableDataTable<T>({ rows, columns, initialSort, ...props }: Props<T>) {
    const accessors = useMemo(() => Object.fromEntries(columns.map(column => [column.key, column.value])), [columns]);
    const { sortedRows, sort, requestSort } = useSortableData(rows, accessors, initialSort || { key: columns[0]?.key ?? '', direction: 'asc' });
    return <RecordTable {...props} rows={sortedRows} columns={columns} sort={sort} onSort={requestSort} />;
}
