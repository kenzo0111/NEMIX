import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
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
    const [collapsed, setCollapsed] = useState(false);

    const modules = getSidebarModules('Audit Logs', 'Manage Login Trails');

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
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Audit Logs - Login Audit Logs" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'} ml-0`}>
                <PageHeader
                    title="Login Audit Logs"
                    description="Review authentication activity, access results, user accounts, and source IP addresses recorded by the system."
                    breadcrumbs={[
                        { name: 'Audit Logs' },
                        { name: 'Login Audit' },
                    ]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 max-w-[1600px] mx-auto pb-16 min-w-0 w-full">
                    {/* Subtle Institutional Security Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200/90 rounded-lg shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-red-50 text-red-900 rounded-md border border-red-100">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                    Authentication Audit Ledger
                                </span>
                                <span className="hidden sm:inline-block mx-2 text-gray-300">•</span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    Official read-only authentication audit trail
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
                                title="Print or save ledger as PDF"
                            >
                                <Printer className="w-3.5 h-3.5 text-gray-500" />
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
            </main>
        </div>
    );
}
