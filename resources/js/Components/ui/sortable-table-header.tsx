import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '@/Hooks/useSortableData';
import { cn } from '@/lib/utils';

interface SortableTableHeaderProps<K extends string> extends React.ThHTMLAttributes<HTMLTableCellElement> {
    column: K;
    activeColumn?: K | null;
    direction?: SortDirection;
    onSort: (column: K) => void;
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

export default function SortableTableHeader<K extends string>({
    column,
    activeColumn,
    direction = 'asc',
    onSort,
    children,
    align = 'left',
    className,
    ...props
}: SortableTableHeaderProps<K>) {
    const active = activeColumn === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
        <th
            {...props}
            scope="col"
            aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            className={cn(className)}
        >
            <button
                type="button"
                onClick={() => onSort(column)}
                className={cn(
                    'group inline-flex w-full items-center gap-1.5 rounded px-1 py-1 font-medium text-inherit transition-colors hover:bg-red-50 hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-300',
                    align === 'center' && 'justify-center text-center',
                    align === 'right' && 'justify-end text-right'
                )}
            >
                <span>{children}</span>
                <Icon
                    className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        active ? 'text-red-900 dark:text-red-400' : 'text-slate-400 group-hover:text-red-800 dark:text-slate-500'
                    )}
                    aria-hidden="true"
                />
            </button>
        </th>
    );
}
