import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { ScrollText, Printer } from 'lucide-react';
import {
    TransactionAuditPageProps,
    TransactionAuditRecord,
    PaginatedData,
    TransactionAuditFilters,
} from './types';
import { TransactionAuditSummary } from './Components/TransactionAuditSummary';
import { TransactionAuditToolbar } from './Components/TransactionAuditToolbar';
import { TransactionAuditTable } from './Components/TransactionAuditTable';
import { TransactionAuditPagination } from './Components/TransactionAuditPagination';

export default function TransactionAuditIndex({
    auth,
    logs,
    summary,
    filters = {},
    availableModules = [],
    availableActions = [],
}: TransactionAuditPageProps) {
    const page = usePage();
    const user = auth?.user || (page.props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);

    const modules = getSidebarModules('Audit Logs', 'Transaction Audit');

    // Determine whether logs is PaginatedData or plain array
    const isPaginated =
        !Array.isArray(logs) &&
        logs !== null &&
        typeof logs === 'object' &&
        'data' in logs;

    const records: TransactionAuditRecord[] = useMemo(() => {
        if (isPaginated) {
            return (logs as PaginatedData<TransactionAuditRecord>).data || [];
        }
        return Array.isArray(logs) ? logs : [];
    }, [logs, isPaginated]);

    const paginationData: PaginatedData<TransactionAuditRecord> = useMemo(() => {
        if (isPaginated) {
            return logs as PaginatedData<TransactionAuditRecord>;
        }
        return {
            data: records,
            current_page: 1,
            last_page: 1,
            per_page: records.length || 25,
            total: records.length,
            from: records.length > 0 ? 1 : 0,
            to: records.length,
            links: [],
            prev_page_url: null,
            next_page_url: null,
        };
    }, [isPaginated, logs, records]);

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.module ||
        filters.action ||
        filters.date_from ||
        filters.date_to
    );

    const handleFilterChange = (newFilters: TransactionAuditFilters) => {
        const queryParams: Record<string, string | number> = {};

        if (newFilters.search) queryParams.search = newFilters.search;
        if (newFilters.module) queryParams.module = newFilters.module;
        if (newFilters.action) queryParams.action = newFilters.action;
        if (newFilters.date_from) queryParams.date_from = newFilters.date_from;
        if (newFilters.date_to) queryParams.date_to = newFilters.date_to;
        if (newFilters.page && newFilters.page > 1) queryParams.page = newFilters.page;

        router.get(route('audit-logs.transaction-trails'), queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['logs', 'summary', 'filters'],
        });
    };

    const handleReset = () => {
        router.get(route('audit-logs.transaction-trails'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['logs', 'summary', 'filters'],
        });
    };

    const handlePrintLedger = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Audit Logs - Transaction Audit Logs" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <PageHeader
                    title="Transaction Audit Logs"
                    description="Review recorded inventory, compliance, configuration, and administrative system activities."
                    breadcrumbs={[
                        { name: 'Audit Logs' },
                        { name: 'Transaction Audit' },
                    ]}
                />

                <div className="p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto pb-16">
                    {/* Institutional Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200/90 rounded-lg shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-red-50 text-red-900 rounded-md border border-red-100">
                                <ScrollText className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                    Transaction Audit Ledger
                                </span>
                                <span className="hidden sm:inline-block mx-2 text-gray-300">•</span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    Official read-only system activity and audit trail
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Active Ledger
                            </span>
                            <button
                                type="button"
                                onClick={handlePrintLedger}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors shadow-2xs"
                                title="Print or export current view"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Ledger</span>
                            </button>
                        </div>
                    </div>

                    {/* Compact Summary Strip */}
                    <TransactionAuditSummary
                        summary={summary}
                        hasActiveFilters={hasActiveFilters}
                    />

                    {/* Filter Toolbar */}
                    <TransactionAuditToolbar
                        filters={filters}
                        availableModules={availableModules}
                        availableActions={availableActions}
                        onFilterChange={handleFilterChange}
                        onReset={handleReset}
                    />

                    {/* Audit Ledger Table */}
                    <TransactionAuditTable
                        records={records}
                        hasActiveFilters={hasActiveFilters}
                        onResetFilters={handleReset}
                    />

                    {/* Pagination */}
                    <TransactionAuditPagination
                        pagination={paginationData}
                        filters={filters}
                    />
                </div>
            </main>
        </div>
    );
}
