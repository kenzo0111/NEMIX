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
    coordinatorLayout: _coordinatorLayout = false,
    pagination,
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
        <div className="ui-pagination rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {from ?? 0}–{to ?? 0}
                </span>{' '}
                of <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{total.toLocaleString('en-PH')}</span> records
            </span>

            {last_page > 1 && (
                <div className="flex items-center gap-2">
                    <Button variant="secondary"
                        type="button"
                        onClick={() => navigateToPage(prev_page_url)}
                        disabled={!prev_page_url || current_page <= 1}
                    >
                        Previous
                    </Button>

                    <span className="px-2 font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                        Page <span className="font-semibold text-slate-900 dark:text-slate-100">{current_page}</span> of{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{last_page}</span>
                    </span>

                    <Button variant="secondary"
                        type="button"
                        onClick={() => navigateToPage(next_page_url)}
                        disabled={!next_page_url || current_page >= last_page}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
