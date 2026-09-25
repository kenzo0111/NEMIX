import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
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
import { TransactionPrintableLedger } from './Components/TransactionPrintableLedger';

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
    const [collapsed, handleToggleCollapse] = useSidebarCollapse();

    const modules = getSidebarModules('Audit Logs', 'Transaction Audit');

    // Handle before/after print events so native Ctrl+P also triggers clean printable ledger
    useEffect(() => {
        const handleBeforePrint = () => {
            document.body.classList.add('printing-audit');
        };
        const handleAfterPrint = () => {
            document.body.classList.remove('printing-audit');
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
            document.body.classList.remove('printing-audit');
        };
    }, []);

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
        filters.date_to ||
        (filters.view_mode && filters.view_mode !== 'business')
    );

    const handleFilterChange = (newFilters: TransactionAuditFilters) => {
        const queryParams: Record<string, string | number> = {};

        if (newFilters.search) queryParams.search = newFilters.search;
        if (newFilters.module) queryParams.module = newFilters.module;
        if (newFilters.action) queryParams.action = newFilters.action;
        if (newFilters.date_from) queryParams.date_from = newFilters.date_from;
        if (newFilters.date_to) queryParams.date_to = newFilters.date_to;
        if (newFilters.view_mode && newFilters.view_mode !== 'business') queryParams.view_mode = newFilters.view_mode;
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
        document.body.classList.add('printing-audit');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-audit');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 flex font-sans text-gray-900 dark:text-slate-100 selection:bg-red-900 selection:text-white print:bg-white print:min-h-0 print:h-auto print:block print:p-0">
            <Head title="Audit Logs - Transaction Audit Logs" />

            {/* Dashboard Sidebar is completely hidden in print */}
            <div className="print:hidden audit-print-hide">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={handleToggleCollapse}
                />
            </div>

            <main
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out audit-main-content ${
                    collapsed ? 'md:ml-20' : 'md:ml-72'
                } ml-0 print:ml-0 print:m-0 print:p-0 print:max-w-none print:w-full`}
            >
                {/* PageHeader is completely hidden in print */}
                <div className="print:hidden audit-print-hide">
                    <PageHeader
                        title="Transaction Audit Logs"
                        description="Review recorded inventory, compliance, configuration, and administrative system activities."
                        breadcrumbs={[
                            { name: 'Audit Logs' },
                            { name: 'Transaction Audit' },
                        ]}
                    />
                </div>

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 max-w-[1600px] mx-auto pb-16 min-w-0 w-full print:p-0 print:m-0 print:space-y-0 print:max-w-none print:w-full">
                    {/* Screen View (Interactive Dashboard Controls) - Hidden on Print */}
                    <div className="space-y-5 print:hidden audit-print-hide">
                        {/* Institutional Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-lg shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 rounded-md border border-red-100 dark:border-red-900/50">
                                    <ScrollText className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wide">
                                        Transaction Audit Ledger
                                    </span>
                                    <span className="hidden sm:inline-block mx-2 text-gray-300 dark:text-slate-600">•</span>
                                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                        Official read-only system activity and audit trail
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                                    Active Ledger
                                </span>
                                <button
                                    type="button"
                                    onClick={handlePrintLedger}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
                                    title="Print or export official transaction audit ledger"
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

                    {/* Official Printable Audit Ledger for Print Media / PDF */}
                    <div className="hidden print:block">
                        <TransactionPrintableLedger
                            records={records}
                            summary={summary}
                            filters={filters}
                            currentUser={user}
                            branding={(page.props as any).branding}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
