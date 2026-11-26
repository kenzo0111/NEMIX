import { Button } from '@/Components/ui/button';
import DashboardContent from '@/Layouts/DashboardContent';
import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { secondaryButton } from '@/Pages/Inventory/Coordinator/inventory';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
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
    const isCoordinator = Boolean((page.props.auth as any)?.capabilities?.coordinatorInventory);
    const user = auth?.user || (page.props.auth as any)?.user;

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
        const queryParams: Record<string, string | number> = {
            sort: newFilters.sort || filters.sort || 'date',
            direction: newFilters.direction || filters.direction || 'desc',
            per_page: paginationData.per_page,
        };

        if (newFilters.search) queryParams.search = newFilters.search;
        if (newFilters.role) queryParams.role = newFilters.role;
        if (newFilters.status) queryParams.status = newFilters.status;
        if (newFilters.date_from) queryParams.date_from = newFilters.date_from;
        if (newFilters.date_to) queryParams.date_to = newFilters.date_to;
        if (newFilters.sort) queryParams.sort = newFilters.sort;
        if (newFilters.direction) queryParams.direction = newFilters.direction;
        if (newFilters.page && newFilters.page > 1) queryParams.page = newFilters.page;

        router.get(route('audit-logs.login-trails'), queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['loginData', 'summary', 'filters'],
        });
    };

    const handleReset = () => {
        router.get(route('audit-logs.login-trails'), { sort: filters.sort || 'date', direction: filters.direction || 'desc', per_page: paginationData.per_page }, {
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
        <>
            <Head title={isCoordinator ? 'Login Audit' : 'Login Audit Logs'} />

            <DashboardLayout modules={modules} user={user}>
                <DashboardContent className="print:p-0 print:m-0 print:space-y-0 print:max-w-none print:w-full">
                    <div className="print:hidden audit-print-hide">
                        <PageHeader
                            embedded
                            title={isCoordinator ? 'Login Audit' : 'Login Audit Logs'}
                            description={isCoordinator ? 'Review recorded authentication activity, access results, and session details.' : 'Review sign-ins, access results, and source IP addresses.'}
                            breadcrumbs={isCoordinator ? [{ name: 'Login Audit' }] : [{ name: 'Audit Logs' }, { name: 'Login Audit Logs' }]}
                            actions={isCoordinator ? <Button variant="secondary" type="button" onClick={handlePrintLedger} className={secondaryButton} title="Print or export official authentication audit ledger"><Printer size={17} />Print Ledger</Button> : undefined}
                        />
                    </div>
                    {/* Screen View (Interactive Dashboard Controls) - Hidden on Print */}
                    <div data-tour="system-admin-login-audit" className="space-y-6 print:hidden audit-print-hide">
                        {/* Subtle Institutional Security Header Banner */}
                        <div className={`${isCoordinator ? "hidden" : "flex"} flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm`}>
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 rounded-md border border-red-100 dark:border-red-900/40">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 normal-case tracking-normal">
                                        Authentication Audit Ledger
                                    </span>
                                    <span className="hidden sm:inline-block mx-2 text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        Official read-only authentication audit trail
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                                    Active Ledger
                                </span>
                                <Button variant="secondary"
                                    type="button"
                                    onClick={handlePrintLedger}
                                    className="inline-flex items-center gap-1.5"
                                    title="Print or export official authentication audit ledger"
                                >
                                    <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span>Print Ledger</span>
                                </Button>
                            </div>
                        </div>

                        {/* Compact Institutional Summary Strip */}
                        <LoginAuditSummary
                            coordinatorLayout={isCoordinator}
                            summary={summary}
                            hasActiveFilters={hasActiveFilters}
                        />

                        {/* Filter and Search Toolbar */}
                        <LoginAuditToolbar
                            coordinatorLayout={isCoordinator}
                            filters={filters}
                            availableRoles={availableRoles}
                            availableStatuses={availableStatuses}
                            onFilterChange={handleFilterChange}
                            onReset={handleReset}
                        />

                        {/* Audit Ledger Table */}
                        <LoginAuditTable
                            coordinatorLayout={isCoordinator}
                            records={records}
                            hasActiveFilters={hasActiveFilters}
                            onResetFilters={handleReset}
                            sort={filters.sort || 'date'}
                            direction={filters.direction || 'desc'}
                            onSort={(sort) => handleFilterChange({
                                ...filters,
                                sort,
                                direction: filters.sort === sort && filters.direction === 'asc' ? 'desc' : 'asc',
                                page: 1,
                            })}
                        />

                        {/* Server-side Pagination Footer */}
                        <LoginAuditPagination
                            coordinatorLayout={isCoordinator}
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
                </DashboardContent>
            </DashboardLayout>
        </>
    );
}
