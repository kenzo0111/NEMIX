import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { SortDirection } from '@/Hooks/useSortableData';
import { cn } from '@/lib/utils';

export interface SortOption<K extends string> { value: K; label: string; }

/** Also exposes columns that are hidden in compact tables or card layouts. */
export default function TableSortControls<K extends string>({ options, sortKey, direction, onSort, className, label = 'Sort records by' }: {
    options: SortOption<K>[]; sortKey: K; direction: SortDirection; onSort: (key: K) => void; className?: string; label?: string;
}) {
    const Icon = direction === 'asc' ? ArrowUp : ArrowDown;
    return <div className={cn('table-toolbar flex min-w-0 flex-wrap items-center gap-2', className)}>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="shrink-0">Sort by</span>
            <select aria-label={label} value={sortKey} onChange={event => onSort(event.target.value as K)} className="ui-field table-control min-w-0 flex-1 rounded-lg border-slate-300 bg-white pl-3 pr-8 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
        <button type="button" onClick={() => onSort(sortKey)} aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} className="table-control inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-900 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <Icon size={15} aria-hidden="true" />{direction === 'asc' ? 'Ascending' : 'Descending'}
        </button>
    </div>;
}
