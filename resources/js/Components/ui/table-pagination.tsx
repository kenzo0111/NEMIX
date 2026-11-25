import React from 'react';
import { Button } from '@/Components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    from?: number;
    to?: number;
    onPageChange: (page: number) => void;
    recordLabel?: string;
    className?: string;
}

export function TablePagination({
    currentPage,
    totalPages,
    totalRecords,
    from,
    to,
    onPageChange,
    recordLabel = 'records',
    className,
}: TablePaginationProps) {
    if (totalRecords <= 0) return null;

    const fromCount = from ?? Math.min((currentPage - 1) * 10 + 1, totalRecords);
    const toCount = to ?? Math.min(currentPage * 10, totalRecords);
    const lastPage = Math.max(1, totalPages);

    return (
        <div
            className={cn(
                'ui-pagination px-4 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm',
                className
            )}
        >
            <span className="text-slate-600 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {fromCount}
                </span>
                –
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {toCount}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {totalRecords}
                </span>{' '}
                {recordLabel}
            </span>

            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="inline-flex items-center justify-center gap-1.5"
                >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Previous</span>
                </Button>
                <span className="text-slate-600 dark:text-slate-400 font-medium px-1 tabular-nums">
                    Page{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currentPage}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {lastPage}
                    </span>
                </span>
                <Button
                    variant="secondary"
                    type="button"
                    onClick={() => onPageChange(Math.min(currentPage + 1, lastPage))}
                    disabled={currentPage >= lastPage}
                    aria-label="Next page"
                    className="inline-flex items-center justify-center gap-1.5"
                >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                </Button>
            </div>
        </div>
    );
}

export default TablePagination;
