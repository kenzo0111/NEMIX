import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
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

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Audit Logs - Login Audit Logs" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <PageHeader
                    title="Login Audit Logs"
                    description="Review authentication activity, access results, user accounts, and source IP addresses recorded by the system."
                    breadcrumbs={[
                        { name: 'Audit Logs' },
                        { name: 'Login Audit' },
                    ]}
                />

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
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
