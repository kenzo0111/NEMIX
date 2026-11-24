import { Button } from '@/Components/ui/button';
import React from 'react';
import { router } from '@inertiajs/react';
import { PaginatedData, LoginAuditRecord, LoginAuditFilters } from '../types';

interface LoginAuditPaginationProps {
    coordinatorLayout?: boolean;
    pagination: PaginatedData<LoginAuditRecord>;
    filters: LoginAuditFilters;
    routeName?: string;
}

export const LoginAuditPagination: React.FC<LoginAuditPaginationProps> = ({
    coordinatorLayout = false,
    pagination,
    filters,
    routeName = 'audit-logs.login-trails',
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
            only: ['loginData', 'summary', 'filters'],
        });
    };

    return (
        <div className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${coordinatorLayout ? "rounded-xl px-4 py-4 sm:px-6 shadow-sm" : "rounded-lg px-4 py-3 shadow-sm"}`}>
            <span className="text-gray-600 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {from ?? 0}–{to ?? 0}
                </span>{' '}
                of <span className="font-semibold text-gray-900 dark:text-slate-100">{total.toLocaleString('en-PH')}</span> records
            </span>

            {last_page > 1 && (
                <div className="flex items-center gap-2">
                    <Button variant="secondary"
                        type="button"
                        onClick={() => navigateToPage(prev_page_url)}
                        disabled={!prev_page_url || current_page <= 1}
                        className=""
                    >
                        Previous
                    </Button>

                    <span className="px-2 font-medium text-gray-600 dark:text-slate-400">
                        Page <span className="font-semibold text-gray-900 dark:text-slate-100">{current_page}</span> of{' '}
                        <span className="font-semibold text-gray-900 dark:text-slate-100">{last_page}</span>
                    </span>

                    <Button variant="secondary"
                        type="button"
                        onClick={() => navigateToPage(next_page_url)}
                        disabled={!next_page_url || current_page >= last_page}
                        className=""
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
