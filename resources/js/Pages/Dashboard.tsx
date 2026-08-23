import SystemModeBadge from '@/Components/SystemModeBadge';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type MovementPoint = {
    label: string;
    starting: number;
    stockIn: number;
    risIssued: number;
};

type MovementInputPoint =
    | number
    | {
        label?: string;
        starting?: number;
        stockIn?: number;
        risIssued?: number;
    };

export default function Dashboard({
    auth,
    stats = { totalInventoryValue: '₱0', totalRisIssued: 0, itemsIssuedMtd: 0, unserviceable: 0, criticalAlerts: 0, activeInventoryItems: 0 },
    chartData = { monthly: [], yearly: [], custom: [] },
    lowStockAlerts = [],
    auditLogs = [],
    roles = [],
    filters = { chartFilter: 'monthly', customStartDate: '', customEndDate: '' },
}: {
    auth: any;
    stats?: { totalInventoryValue: string; totalRisIssued: number; itemsIssuedMtd: number; unserviceable: number; criticalAlerts: number; activeInventoryItems?: number; };
    chartData?: { monthly: MovementInputPoint[]; yearly: MovementInputPoint[]; custom?: MovementInputPoint[]; };
    lowStockAlerts?: Array<{ name: string; sku: string; current: number; min: number; unit: string; priority: string; }>;
    auditLogs?: Array<{ user: string; role: string; action: string; details: string; id: string; status: string; time: string; timestamp?: string; badge: string; }>;
    roles?: Array<{ value: string; label: string; }>;
    filters?: { chartFilter?: string; customStartDate?: string; customEndDate?: string; };
}) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // State for the Movement Analytics Filter
    const [chartFilter, setChartFilter] = useState(filters?.chartFilter || 'monthly');
    const [customStartDate, setCustomStartDate] = useState(filters?.customStartDate || '');
    const [customEndDate, setCustomEndDate] = useState(filters?.customEndDate || '');
    const [customRangeError, setCustomRangeError] = useState('');

    useEffect(() => {
        if (filters?.chartFilter) {
            setChartFilter(filters.chartFilter);
        }
        if (filters?.customStartDate !== undefined) {
            setCustomStartDate(filters.customStartDate || '');
        }
        if (filters?.customEndDate !== undefined) {
            setCustomEndDate(filters.customEndDate || '');
        }
    }, [filters]);

    // State for Audit Trail Filters
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<any>(null);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<any>(null);
    const [selectedRowLimit, setSelectedRowLimit] = useState<{ value: number | string; label: string } | null>(null);
    const [auditSearchQuery, setAuditSearchQuery] = useState('');

    const chartFilterOptions = [
        { value: 'monthly', label: 'Monthly View (Last 6 Mos)' },
        { value: 'yearly', label: 'Yearly View' },
        { value: 'custom', label: 'Custom Range...' },
    ];

    const rowLimitOptions = [
        { value: 5, label: '5 Rows' },
        { value: 10, label: '10 Rows' },
        { value: 25, label: '25 Rows' },
        { value: 'all', label: 'All Rows' },
    ];

    const roleFilterOptions = roles && roles.length > 0 ? roles : [
        { value: 'System Admin', label: 'System Admin' },
        { value: 'Internal Auditor', label: 'Internal Auditor' },
        { value: 'External Auditor', label: 'External Auditor' },
        { value: 'Property Staff', label: 'Property Staff' },
    ];

    const selectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
            borderWidth: '1px',
            padding: '1px 2px',
            minWidth: '160px',
            boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
            fontSize: '0.8125rem',
            fontWeight: '600',
            backgroundColor: '#ffffff',
            '&:hover': { borderColor: '#7f1d1d' },
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: '#fef2f2',
            borderColor: '#fca5a5',
            borderWidth: '1px',
            borderRadius: '0.25rem',
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: '#7f1d1d',
            fontSize: '0.75rem',
            fontWeight: '700',
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            color: '#7f1d1d',
            ':hover': {
                backgroundColor: '#7f1d1d',
                color: '#ffffff',
            },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#111827',
            padding: '7px 12px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: '#111827',
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    const auditTrailLogs = auditLogs && auditLogs.length > 0 ? auditLogs : [
        { user: 'Vince Balce', role: 'System Admin', action: 'Certified Unserviceable Assets', details: 'Added 5 unserviceable desktop units to disposal list', id: 'TRX-1006', status: 'Verified', time: '15 mins ago', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
        { user: 'Maria Santos', role: 'Internal Auditor', action: 'Generated Compliance Report', details: 'Generated Annual Physical Inventory & Inspection Report for FY 2025', id: 'TRX-1007', status: 'Logged', time: '1 hour ago', badge: 'bg-blue-50 text-blue-800 border border-blue-200' },
        { user: 'Juan Dela Cruz', role: 'Property Staff', action: 'Stock In Requisition', details: 'Received 100 reams of A4 Copy Paper from Advance Paper Corp', id: 'TRX-1008', status: 'Verified', time: '3 hours ago', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
        { user: 'Staff Member', role: 'Property Staff', action: 'Issued Inventory Stock', details: 'Issued 20 units of Ballpen Black to SPMO Administrative Office', id: 'TRX-1009', status: 'Flagged', time: '5 hours ago', badge: 'bg-amber-50 text-amber-800 border border-amber-200' },
        { user: 'System Admin', role: 'System Admin', action: 'Operating Mode Switched', details: 'Switched system operating mode from LIVE PRODUCTION to MAINTENANCE MODE', id: 'TRX-1010', status: 'Verified', time: '1 day ago', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
    ];

    const statusFilterOptions = useMemo(() => {
        const statuses = Array.from(new Set(auditTrailLogs.map((log) => log.status).filter(Boolean)));
        return statuses.map((s) => ({ value: s, label: s }));
    }, [auditTrailLogs]);

    const filteredAuditLogs = useMemo(() => {
        let logs = auditTrailLogs.filter((log) => {
            if (selectedRoleFilter) {
                if (Array.isArray(selectedRoleFilter)) {
                    if (selectedRoleFilter.length > 0) {
                        const selectedValues = selectedRoleFilter.map((r: any) => r.value).filter(Boolean);
                        if (selectedValues.length > 0 && !selectedValues.includes(log.role)) {
                            return false;
                        }
                    }
                } else if (selectedRoleFilter.value && log.role !== selectedRoleFilter.value) {
                    return false;
                }
            }

            if (selectedStatusFilter?.value && log.status !== selectedStatusFilter.value) {
                return false;
            }

            if (auditSearchQuery.trim() !== '') {
                const query = auditSearchQuery.toLowerCase();
                const userMatch = log.user?.toLowerCase().includes(query);
                const roleMatch = log.role?.toLowerCase().includes(query);
                const actionMatch = log.action?.toLowerCase().includes(query);
                const detailsMatch = log.details?.toLowerCase().includes(query);
                const statusMatch = log.status?.toLowerCase().includes(query);
                const idMatch = log.id?.toLowerCase().includes(query);
                return userMatch || roleMatch || actionMatch || detailsMatch || statusMatch || idMatch;
            }
            return true;
        });

        if (selectedRowLimit && selectedRowLimit.value !== 'all' && typeof selectedRowLimit.value === 'number') {
            logs = logs.slice(0, selectedRowLimit.value);
        }

        return logs;
    }, [auditTrailLogs, selectedRoleFilter, selectedStatusFilter, auditSearchQuery, selectedRowLimit]);

    const applyMovementFilter = (filter: string, startDate?: string, endDate?: string) => {
        router.get(
            route('dashboard'),
            {
                chart_filter: filter,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['chartData', 'filters'],
            }
        );
    };

    const handleChartFilterChange = (selectedOption: { value: string; label: string } | null) => {
        const selected = selectedOption?.value || 'monthly';
        setChartFilter(selected);
        setCustomRangeError('');

        if (selected === 'monthly' || selected === 'yearly') {
            applyMovementFilter(selected);
        }
    };

    const handleApplyCustomRange = () => {
        if (!customStartDate || !customEndDate) {
            setCustomRangeError('Please select both start and end dates.');
            return;
        }

        if (new Date(customStartDate) > new Date(customEndDate)) {
            setCustomRangeError('Start date must be earlier than or equal to end date.');
            return;
        }

        setCustomRangeError('');
        applyMovementFilter('custom', customStartDate, customEndDate);
    };

    const movementPoints = useMemo<MovementPoint[]>(() => {
        const fallback: MovementPoint[] = [
            { label: 'M1', starting: 40, stockIn: 28, risIssued: 16 },
            { label: 'M2', starting: 70, stockIn: 49, risIssued: 28 },
            { label: 'M3', starting: 45, stockIn: 31, risIssued: 18 },
            { label: 'M4', starting: 90, stockIn: 63, risIssued: 36 },
            { label: 'M5', starting: 65, stockIn: 45, risIssued: 26 },
            { label: 'M6', starting: 85, stockIn: 59, risIssued: 34 },
        ];

        const source = chartFilter === 'yearly'
            ? chartData?.yearly
            : chartFilter === 'custom'
                ? chartData?.custom
                : chartData?.monthly;
        if (!source || source.length === 0) {
            return chartFilter === 'custom' ? [] : fallback;
        }

        return source.map((dataPoint: any, idx: number) => {
            if (typeof dataPoint === 'number') {
                return {
                    label: chartFilter === 'yearly' ? `202${idx}` : `M${idx + 1}`,
                    starting: dataPoint,
                    stockIn: Math.round(dataPoint * 0.7),
                    risIssued: Math.round(dataPoint * 0.4),
                };
            }

            return {
                label: dataPoint.label ?? (chartFilter === 'yearly' ? `202${idx}` : `M${idx + 1}`),
                starting: Number(dataPoint.starting) || 0,
                stockIn: Number(dataPoint.stockIn) || 0,
                risIssued: Number(dataPoint.risIssued) || 0,
            };
        });
    }, [chartData, chartFilter]);

    const movementChartData = useMemo<ChartData<'bar'>>(() => ({
        labels: movementPoints.map((point) => point.label),
        datasets: [
            {
                label: 'Starting Stock',
                data: movementPoints.map((point) => point.starting),
                backgroundColor: '#d1d5db',
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 24,
            },
            {
                label: 'Stock In',
                data: movementPoints.map((point) => point.stockIn),
                backgroundColor: '#7f1d1d',
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 24,
            },
            {
                label: 'RIS Issued',
                data: movementPoints.map((point) => point.risIssued),
                backgroundColor: '#facc15',
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 24,
            },
        ],
    }), [movementPoints]);

    const movementChartOptions = useMemo<ChartOptions<'bar'>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 650,
            easing: 'easeOutCubic',
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                cornerRadius: 8,
                padding: 10,
                titleFont: { size: 12, weight: 700 },
                bodyFont: { size: 12, weight: 600 },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: 600 },
                },
            },
            y: {
                beginAtZero: true,
                suggestedMax: 10,
                grid: {
                    color: 'rgba(148, 163, 184, 0.18)',
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 600 },
                    precision: 0,
                },
            },
        },
    }), []);

    const getAuditStatusClass = (status: string) => {
        switch (status) {
            case 'Verified':
                return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80';
            case 'Logged':
                return 'bg-blue-50 text-blue-800 border border-blue-200/80';
            case 'Flagged':
                return 'bg-amber-50 text-amber-800 border border-amber-200/80';
            case 'In Progress':
                return 'bg-indigo-50 text-indigo-800 border border-indigo-200/80';
            default:
                return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const getProgressWidthClass = (current: number, min: number) => {
        if (min <= 0) return 'w-0';

        const pct = Math.max(0, Math.min(100, (current / min) * 100));
        if (pct >= 95) return 'w-full';
        if (pct >= 90) return 'w-11/12';
        if (pct >= 80) return 'w-10/12';
        if (pct >= 70) return 'w-9/12';
        if (pct >= 60) return 'w-8/12';
        if (pct >= 50) return 'w-6/12';
        if (pct >= 40) return 'w-5/12';
        if (pct >= 30) return 'w-4/12';
        if (pct >= 20) return 'w-3/12';
        if (pct >= 10) return 'w-2/12';
        if (pct > 0) return 'w-1/12';
        return 'w-0';
    };

    const modules = getSidebarModules();

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="UCN Supply & Inventory Management Dashboard" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>

                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Non-Production Mode Alert Banner */}
                    {(usePage().props as any).system?.mode && (usePage().props as any).system?.mode !== 'LIVE PRODUCTION' && (
                        <div className={`px-6 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
                            (usePage().props as any).system?.mode === 'MAINTENANCE MODE'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : (usePage().props as any).system?.mode === 'STAGING SANDBOX'
                                ? 'bg-sky-950 text-sky-300 border-sky-800'
                                : 'bg-purple-950 text-purple-300 border-purple-800'
                        }`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                            <span>
                                {(usePage().props as any).system?.mode === 'MAINTENANCE MODE' && 'SYSTEM MAINTENANCE MODE ACTIVE — Write operations restricted to System Administrators.'}
                                {(usePage().props as any).system?.mode === 'STAGING SANDBOX' && 'STAGING SANDBOX ENVIRONMENT — Operating with isolated test database.'}
                                {(usePage().props as any).system?.mode === 'TRAINING SIMULATION' && 'TRAINING SIMULATION MODE — Operating with synthetic demo data.'}
                            </span>
                        </div>
                    )}

                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">Supply and Inventory Management System (SIMS)</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Supply & Inventory Management</h2>
                            <p className="text-xs text-gray-500 font-medium">Official Asset Control, Stock Requisition & Inventory Audit System</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">

                    {/* Welcome / System Overview Banner */}
                    <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-400 p-6 lg:p-7 shadow-xs relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="max-w-3xl space-y-2.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-900/90 border border-red-800 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Official System Status: Operational & Audited
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-bold font-serif leading-tight text-white tracking-tight">
                                    University Supply & Inventory Management Overview
                                </h1>
                                <p className="text-red-100/90 text-sm font-normal leading-relaxed">
                                    Welcome back, <strong className="text-white">{user.name}</strong>. The Supply & Property Management Office Stockroom currently has <strong className="text-amber-300 font-semibold">{new Intl.NumberFormat('en-US').format(stats.activeInventoryItems ?? 0)} {(stats.activeInventoryItems ?? 0) === 1 ? 'available consumable item' : 'available consumable items'}</strong>.
                                </p>
                            </div>

                            <div className="shrink-0 w-full lg:w-auto">
                                <Link
                                    href={route('compliance.analytics')}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 text-red-950 rounded font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-xs border border-amber-300"
                                >
                                    <span>Inventory Analytics Report</span>
                                    <svg className="w-4 h-4 text-red-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                        {[
                            {
                                label: 'Total Inventory Value',
                                value: stats.totalInventoryValue ?? '₱0',
                                sub: 'Across All Registered Units',
                                trend: '+5.2%',
                                trendUp: true,
                                color: 'text-red-900',
                                bg: 'bg-red-50',
                                icon: (
                                    <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Total RIS Issued',
                                value: stats.totalRisIssued ?? 0,
                                sub: 'Completed Requests',
                                trend: 'Lifetime',
                                trendUp: true,
                                color: 'text-red-900',
                                bg: 'bg-red-50',
                                icon: (
                                    <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Items Issued (MTD)',
                                value: stats.itemsIssuedMtd ?? 0,
                                sub: 'Current Month Total',
                                trend: '+18%',
                                trendUp: true,
                                color: 'text-red-900',
                                bg: 'bg-red-50',
                                icon: (
                                    <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Unserviceable Items',
                                value: stats.unserviceable ?? 0,
                                sub: 'Pending Disposal / Audit',
                                trend: 'Needs Check',
                                trendUp: false,
                                color: 'text-amber-800',
                                bg: 'bg-amber-50',
                                icon: (
                                    <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Critical Stock Alerts',
                                value: stats.criticalAlerts ?? 0,
                                sub: 'Requires Reordering',
                                trend: 'Urgent',
                                trendUp: false,
                                color: 'text-red-700',
                                bg: 'bg-red-50',
                                icon: (
                                    <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                )
                            },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2.5">
                                    <div className={`p-2 rounded ${stat.bg} border border-gray-200`}>
                                        {stat.icon}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${stat.trendUp ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stat.value}</h3>
                                    <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">{stat.label}</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Movement Analytics Section */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">Inventory Movement Analytics</h3>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Stock Receipts (Stock-In) vs. Requisition & Issuance Slip (RIS) Summary</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
                                <Select
                                    aria-label="Movement analytics filter"
                                    options={chartFilterOptions}
                                    value={chartFilterOptions.find(opt => opt.value === chartFilter)}
                                    onChange={handleChartFilterChange}
                                    styles={selectStyles}
                                    isSearchable={false}
                                />
                                {chartFilter === 'custom' ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full sm:w-auto rounded border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:border-red-800 focus:ring-1 focus:ring-red-800 focus:outline-none"
                                            aria-label="Custom range start date"
                                        />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full sm:w-auto rounded border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:border-red-800 focus:ring-1 focus:ring-red-800 focus:outline-none"
                                            aria-label="Custom range end date"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCustomRange}
                                            className="rounded bg-red-900 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-800 uppercase tracking-wider"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[380px] bg-white">
                            {customRangeError ? (
                                <div className="mb-4 w-full max-w-6xl rounded border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800">
                                    {customRangeError}
                                </div>
                            ) : null}
                            <div className="w-full h-[300px] px-2 max-w-6xl mx-auto">
                                <Bar data={movementChartData} options={movementChartOptions} />
                            </div>
                            {movementPoints.length === 0 ? (
                                <p className="mt-4 text-xs font-semibold text-gray-500">No movement data found for the selected view.</p>
                            ) : null}
                            <div className="flex gap-8 mt-6 pt-4 border-t border-gray-200 w-full justify-center">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-300 border border-gray-400"></div><span className="text-xs text-gray-700 font-bold uppercase tracking-wider">Starting Stock</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-900 border border-red-950"></div><span className="text-xs text-gray-700 font-bold uppercase tracking-wider">Stock Receipts (In)</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-400 border border-amber-500"></div><span className="text-xs text-gray-700 font-bold uppercase tracking-wider">RIS Issuances</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Safety Stock & Reorder Monitoring Ledger */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100/90">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">Safety Stock & Reorder Monitoring Ledger</h3>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Critical items currently below mandatory university safety stock thresholds</p>
                            </div>
                            <Link
                                href={route('inventory.index')}
                                className="text-xs font-bold text-red-900 hover:text-red-950 hover:bg-red-50 border border-red-200 rounded px-3 py-1.5 transition-colors inline-flex items-center gap-1 uppercase tracking-wider"
                            >
                                <span>View All Alerts</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                            {(lowStockAlerts && lowStockAlerts.length > 0 ? lowStockAlerts : [
                                { name: 'A4 Copier Paper (80gsm)', sku: 'SUP-PAP-001', current: 12, min: 50, unit: 'Reams', priority: 'Critical' },
                                { name: 'HP Laser Jet Toner 85A', sku: 'SUP-TON-085', current: 2, min: 10, unit: 'Units', priority: 'Critical' },
                                { name: 'Ballpoint Pen (Black)', sku: 'SUP-PEN-002', current: 45, min: 100, unit: 'Pieces', priority: 'Warning' },
                            ]).map((item, i) => (
                                <div key={i} className="p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 border font-mono ${item.priority === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                                }`}>
                                                {item.priority === 'Critical' ? 'CRITICAL REORDER' : 'WARNING THRESHOLD'}
                                            </span>
                                            <h4 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h4>
                                            <p className="text-[11px] font-mono font-bold text-gray-500 tracking-wider uppercase mt-0.5">CATALOG NO: {item.sku}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-2xl font-bold text-gray-900 font-sans">{item.current}</span>
                                                <span className="text-xs font-semibold text-gray-500 ml-1.5">/ {item.min} {item.unit}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-red-700 font-mono">-{((item.min - item.current) / item.min * 100).toFixed(0)}% DEFICIT</span>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${item.priority === 'Critical' ? 'bg-red-700' : 'bg-amber-500'
                                                    } ${getProgressWidthClass(item.current, item.min)}`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Transaction Audit Ledger */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">System Transaction Audit Ledger</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-red-100 text-red-900 rounded-full border border-red-200">
                                        {filteredAuditLogs.length} {filteredAuditLogs.length === 1 ? 'Entry' : 'Entries'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Chronological Activity Log for Property Custodians, Supply Officers, and Auditors</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={auditSearchQuery}
                                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                                        placeholder="Search user, action, details..."
                                        className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold border border-gray-300 rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                                    />
                                    <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {auditSearchQuery && (
                                        <button
                                            onClick={() => setAuditSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <Select
                                    isMulti
                                    options={roleFilterOptions}
                                    value={selectedRoleFilter}
                                    onChange={setSelectedRoleFilter}
                                    styles={selectStyles}
                                    placeholder="Filter by Role(s)"
                                    isClearable
                                />

                                <Select
                                    options={statusFilterOptions}
                                    value={selectedStatusFilter}
                                    onChange={setSelectedStatusFilter}
                                    styles={selectStyles}
                                    placeholder="Filter by Status"
                                    isClearable
                                />

                                <Select
                                    options={rowLimitOptions}
                                    value={selectedRowLimit}
                                    onChange={setSelectedRowLimit}
                                    styles={selectStyles}
                                    placeholder="Row Limit"
                                    isClearable
                                />

                                {(selectedRoleFilter || selectedStatusFilter || auditSearchQuery || selectedRowLimit) && (
                                    <button
                                        onClick={() => {
                                            setSelectedRoleFilter(null);
                                            setSelectedStatusFilter(null);
                                            setSelectedRowLimit(null);
                                            setAuditSearchQuery('');
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                                        title="Reset all audit ledger filters"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-300 bg-gray-200/60 font-serif">
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/4">Authorized User</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-2/5">Action Performed</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Audit Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {filteredAuditLogs.length > 0 ? (
                                        filteredAuditLogs.map((row, i) => (
                                            <tr key={i} className="odd:bg-white even:bg-gray-50/50 hover:bg-amber-50/20 transition-colors">
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-bold text-red-900 font-serif">
                                                            {row.user.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="text-xs font-bold text-gray-900">{row.user}</div>
                                                            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 inline-block mt-0.5 w-max">{row.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex flex-col justify-center">
                                                        <div className="text-xs font-bold text-gray-900">{row.action}</div>
                                                        <div className="text-[11px] text-gray-600">{row.details}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${getAuditStatusClass(row.status)}`}>
                                                            {row.status || 'UNKNOWN'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono font-medium">{row.timestamp || row.time}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <p className="text-gray-500 font-medium text-xs">No official audit logs match your selected filter criteria.</p>
                                                {(selectedRoleFilter || selectedStatusFilter || auditSearchQuery || selectedRowLimit) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRoleFilter(null);
                                                            setSelectedStatusFilter(null);
                                                            setSelectedRowLimit(null);
                                                            setAuditSearchQuery('');
                                                        }}
                                                        className="mt-2 text-xs font-bold text-red-900 hover:underline"
                                                    >
                                                        Clear active filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}