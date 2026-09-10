import React from 'react';
import { router } from '@inertiajs/react';
import { PaginatedData, TransactionAuditRecord, TransactionAuditFilters } from '../types';

interface TransactionAuditPaginationProps {
    pagination: PaginatedData<TransactionAuditRecord>;
    filters: TransactionAuditFilters;
    routeName?: string;
}

export const TransactionAuditPagination: React.FC<TransactionAuditPaginationProps> = ({
    pagination,
    filters,
    routeName = 'audit-logs.transaction-trails',
}) => {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const {
        current_page,
        last_page,
        total,
        from,
        to,
        prev_page_url,
        next_page_url,
    } = pagination;

    const navigateToPage = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['logs', 'summary', 'filters'],
        });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <span className="text-gray-600 font-medium">
                Showing{' '}
                <span className="font-bold text-gray-900">
                    {from ?? 0}–{to ?? 0}
                </span>{' '}
                of <span className="font-bold text-gray-900">{total.toLocaleString()}</span> records
            </span>

            {last_page > 1 && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigateToPage(prev_page_url)}
                        disabled={!prev_page_url || current_page <= 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <span className="px-2 font-medium text-gray-600">
                        Page <span className="font-bold text-gray-900">{current_page}</span> of{' '}
                        <span className="font-bold text-gray-900">{last_page}</span>
                    </span>

                    <button
                        type="button"
                        onClick={() => navigateToPage(next_page_url)}
                        disabled={!next_page_url || current_page >= last_page}
                        className="px-3 py-1.5 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
