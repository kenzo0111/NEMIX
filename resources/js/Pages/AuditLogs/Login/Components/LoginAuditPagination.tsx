import React from 'react';
import { router } from '@inertiajs/react';
import TablePagination from '@/Components/ui/table-pagination';
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

    const { current_page, last_page, total, from, to, prev_page_url, next_page_url } = pagination;

    const handlePageChange = (nextPage: number) => {
        const url = nextPage < current_page ? prev_page_url : next_page_url;
        if (!url) return;
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['loginData', 'summary', 'filters'],
        });
    };

    return (
        <TablePagination
            currentPage={current_page}
            totalPages={last_page}
            totalRecords={total}
            from={from ?? 0}
            to={to ?? 0}
            onPageChange={handlePageChange}
            recordLabel="records"
            className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        />
    );
};
