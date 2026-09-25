import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { ShieldCheck, Printer } from 'lucide-react';
import {
    LoginAuditPageProps,
    LoginAuditRecord,
    PaginatedData,
    LoginAuditFilters,
} from './types';
import { LoginAuditSummary } from './Components/LoginAuditSummary';
import { LoginAuditToolbar } from './Components/LoginAuditToolbar';
import { LoginAuditTable } from './Components/LoginAuditTable';
import { LoginAuditPagination } from './Components/LoginAuditPagination';
import { LoginPrintableLedger } from './Components/LoginPrintableLedger';

export default function LoginAuditIndex({
    auth,
    loginData,
    summary,
    filters = {},
    availableRoles = [],
    availableStatuses = [],
}: LoginAuditPageProps) {
    const page = usePage();
    const user = auth?.user || (page.props.auth as any)?.user;
    const [collapsed, handleToggleCollapse] = useSidebarCollapse();

    const modules = getSidebarModules('Audit Logs', 'Manage Login Trails');

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

    // Determine whether loginData is PaginatedData or plain array
    const isPaginated =
        !Array.isArray(loginData) &&
        loginData !== null &&
        typeof loginData === 'object' &&
        'data' in loginData;

    const records: LoginAuditRecord[] = useMemo(() => {
        if (isPaginated) {
            return (loginData as PaginatedData<LoginAuditRecord>).data || [];
        }
        return Array.isArray(loginData) ? loginData : [];
    }, [loginData, isPaginated]);

    const paginationData: PaginatedData<LoginAuditRecord> = useMemo(() => {
        if (isPaginated) {
            return loginData as PaginatedData<LoginAuditRecord>;
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
    }, [isPaginated, loginData, records]);

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.role ||
        filters.status ||
        filters.date_from ||
        filters.date_to
    );

    const handleFilterChange = (newFilters: LoginAuditFilters) => {
        const queryParams: Record<string, string | number> = {};

        if (newFilters.search) queryParams.search = newFilters.search;
        if (newFilters.role) queryParams.role = newFilters.role;
        if (newFilters.status) queryParams.status = newFilters.status;
        if (newFilters.date_from) queryParams.date_from = newFilters.date_from;
        if (newFilters.date_to) queryParams.date_to = newFilters.date_to;
        if (newFilters.page && newFilters.page > 1) queryParams.page = newFilters.page;

        router.get(route('audit-logs.login-trails'), queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['loginData', 'summary', 'filters'],
        });
    };

    const handleReset = () => {
        router.get(route('audit-logs.login-trails'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['loginData', 'summary', 'filters'],
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
            <Head title="Audit Logs - Login Audit Logs" />

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
                        title="Login Audit Logs"
                        description="Review authentication activity, access results, user accounts, and source IP addresses recorded by the system."
                        breadcrumbs={[
                            { name: 'Audit Logs' },
                            { name: 'Login Audit' },
                        ]}
                    />
                </div>

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 max-w-[1600px] mx-auto pb-16 min-w-0 w-full print:p-0 print:m-0 print:space-y-0 print:max-w-none print:w-full">
                    {/* Screen View (Interactive Dashboard Controls) - Hidden on Print */}
                    <div className="space-y-5 print:hidden audit-print-hide">
                        {/* Subtle Institutional Security Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-lg shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 rounded-md border border-red-100 dark:border-red-900/40">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wide">
                                        Authentication Audit Ledger
                                    </span>
                                    <span className="hidden sm:inline-block mx-2 text-gray-300 dark:text-slate-700">•</span>
                                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                        Official read-only authentication audit trail
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
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
                                    title="Print or export official authentication audit ledger"
                                >
                                    <Printer className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                                    <span>Print Ledger</span>
                                </button>
                            </div>
                        </div>

                        {/* Compact Institutional Summary Strip */}
                        <LoginAuditSummary
                            summary={summary}
                            hasActiveFilters={hasActiveFilters}
                        />

                        {/* Filter and Search Toolbar */}
                        <LoginAuditToolbar
                            filters={filters}
                            availableRoles={availableRoles}
                            availableStatuses={availableStatuses}
                            onFilterChange={handleFilterChange}
                            onReset={handleReset}
                        />

                        {/* Audit Ledger Table */}
                        <LoginAuditTable
                            records={records}
                            hasActiveFilters={hasActiveFilters}
                            onResetFilters={handleReset}
                        />

                        {/* Server-side Pagination Footer */}
                        <LoginAuditPagination
                            pagination={paginationData}
                            filters={filters}
                            routeName="audit-logs.login-trails"
                        />
                    </div>

                    {/* Official Printable Audit Ledger for Print Media / PDF */}
                    <div className="hidden print:block">
                        <LoginPrintableLedger
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
