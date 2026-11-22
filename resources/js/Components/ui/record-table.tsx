import React from 'react';
import type { SortState, SortValue } from '@/Hooks/useSortableData';
import { rowSelectionProps } from '@/Hooks/useTableSelection';
import SortableTableHeader from './sortable-table-header';
import { cn } from '@/lib/utils';

export interface RecordColumn<T, K extends string = string> {
    key: K;
    label: React.ReactNode;
    value: (row: T) => SortValue;
    render?: (row: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

export interface RecordTableProps<T, K extends string = string> {
    rows: T[];
    columns: RecordColumn<T, K>[];
    rowKey: (row: T) => string | number;
    sort: SortState<K>;
    onSort: (key: K) => void;
    selectedKey?: string | number | null;
    onSelect?: (row: T) => void;
    className?: string;
    containerClassName?: string;
    caption?: string;
    emptyMessage?: string;
}

/** Renders the supplied order. Server pagination must sort before fetching rows. */
export default function RecordTable<T, K extends string = string>({ rows, columns, rowKey, sort, onSort, selectedKey, onSelect, className, containerClassName, caption, emptyMessage = 'No records found.' }: RecordTableProps<T, K>) {
    return <div className={cn('w-full min-w-0 overflow-x-auto', containerClassName)}>
        <table className={cn('w-full text-left text-sm border-collapse', className)}>
            {caption && <caption className="px-4 py-3.5 text-left text-sm text-slate-500 dark:text-slate-400">{caption}</caption>}
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>{columns.map(column => <SortableTableHeader key={column.key} column={column.key} activeColumn={sort.key} direction={sort.direction} onSort={onSort} align={column.align} className={cn('px-4 py-3.5 font-semibold whitespace-nowrap', column.className)}>{column.label}</SortableTableHeader>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map(row => <tr key={rowKey(row)} {...(onSelect ? rowSelectionProps(selectedKey === rowKey(row), () => onSelect(row)) : {})} className="transition-colors hover:bg-red-50/20 dark:hover:bg-red-950/20">
                    {columns.map(column => <td key={column.key} className={cn('px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300', column.align === 'right' && 'text-right tabular-nums', column.align === 'center' && 'text-center', column.className)}>{column.render ? column.render(row) : String(column.value(row) ?? '—')}</td>)}
                </tr>)}
                {rows.length === 0 && <tr><td colSpan={Math.max(1, columns.length)} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">{emptyMessage}</td></tr>}
            </tbody>
        </table>
    </div>;
}
