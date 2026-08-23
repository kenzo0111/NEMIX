import SystemModeBadge from '@/Components/SystemModeBadge';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import {
    Chart as ChartJS,
    registerables,
    type ChartData,
    type ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(...registerables);

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
    const [chartMode, setChartMode] = useState<'flow' | 'waterfall' | 'ledger'>('flow');
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

    const movementSummary = useMemo(() => {
        if (!movementPoints || movementPoints.length === 0) {
            return {
                startingStock: 0,
                totalStockIn: 0,
                totalRisIssued: 0,
                netChange: 0,
                endingStock: 0,
            };
        }
        const startingStock = movementPoints[0].starting;
        const totalStockIn = movementPoints.reduce((acc, p) => acc + p.stockIn, 0);
        const totalRisIssued = movementPoints.reduce((acc, p) => acc + p.risIssued, 0);
        const netChange = totalStockIn - totalRisIssued;
        const endingStock = Math.max(0, startingStock + netChange);

        return {
            startingStock,
            totalStockIn,
            totalRisIssued,
            netChange,
            endingStock,
        };
    }, [movementPoints]);

    type WaterfallStep = {
        label: string;
        stepNum: string;
        fullTitle: string;
        range: [number, number];
        amount: number;
        type: 'start' | 'inflow' | 'outflow' | 'balance';
        color: string;
        borderColor: string;
    };

    const waterfallSteps = useMemo<WaterfallStep[]>(() => {
        if (!movementPoints || movementPoints.length === 0) return [];

        const start = movementSummary.startingStock;
        const inTotal = movementSummary.totalStockIn;
        const outTotal = movementSummary.totalRisIssued;
        const end = movementSummary.endingStock;

        return [
            {
                label: '1. Starting Stock',
                stepNum: 'Step 1',
                fullTitle: 'Beginning Inventory Balance',
                range: [0, start],
                amount: start,
                type: 'start',
                color: '#64748b',
                borderColor: '#475569',
            },
            {
                label: '2. (+) Total Receipts',
                stepNum: 'Step 2',
                fullTitle: 'Total Deliveries Received (+)',
                range: [start, start + inTotal],
                amount: inTotal,
                type: 'inflow',
                color: '#059669',
                borderColor: '#047857',
            },
            {
                label: '3. (-) Total Issued (RIS)',
                stepNum: 'Step 3',
                fullTitle: 'Total Items Issued Out (-)',
                range: [Math.max(0, start + inTotal - outTotal), start + inTotal],
                amount: outTotal,
                type: 'outflow',
                color: '#e11d48',
                borderColor: '#be123c',
            },
            {
                label: '4. (=) Stock on Hand',
                stepNum: 'Step 4',
                fullTitle: 'Current Available Stock Balance (=)',
                range: [0, end],
                amount: end,
                type: 'balance',
                color: '#7f1d1d',
                borderColor: '#450a0a',
            },
        ];
    }, [movementPoints, movementSummary]);

    const movementChartData = useMemo<ChartData<any>>(() => {
        if (chartMode === 'waterfall') {
            return {
                labels: waterfallSteps.map((s) => s.label),
                datasets: [
                    {
                        type: 'bar' as const,
                        label: 'Inventory Level',
                        data: waterfallSteps.map((s) => s.range),
                        backgroundColor: (context: any) => {
                            const ctx = context.chart?.ctx;
                            if (!ctx) return '#7f1d1d';
                            const step = waterfallSteps[context.dataIndex];
                            const gradient = ctx.createLinearGradient(0, 0, 0, 320);
                            if (step?.type === 'inflow') {
                                gradient.addColorStop(0, '#10b981');
                                gradient.addColorStop(1, '#047857');
                            } else if (step?.type === 'outflow') {
                                gradient.addColorStop(0, '#f43f5e');
                                gradient.addColorStop(1, '#be123c');
                            } else if (step?.type === 'start') {
                                gradient.addColorStop(0, '#64748b');
                                gradient.addColorStop(1, '#334155');
                            } else {
                                gradient.addColorStop(0, '#991b1b');
                                gradient.addColorStop(1, '#7f1d1d');
                            }
                            return gradient;
                        },
                        borderColor: waterfallSteps.map((s) => s.borderColor),
                        borderWidth: 1.5,
                        borderRadius: 8,
                        borderSkipped: false,
                        maxBarThickness: 52,
                    },
                ],
            };
        }

        // 'flow' mode (Monthly Inflow vs Outflow & Balance Line)
        return {
            labels: movementPoints.map((p) => p.label),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Stock on Hand (Balance)',
                    data: movementPoints.map((p) => p.starting + p.stockIn - p.risIssued),
                    borderColor: '#881337',
                    backgroundColor: (context: any) => {
                        const ctx = context.chart?.ctx;
                        if (!ctx) return 'rgba(136, 19, 55, 0.12)';
                        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
                        gradient.addColorStop(0, 'rgba(136, 19, 55, 0.26)');
                        gradient.addColorStop(0.7, 'rgba(136, 19, 55, 0.05)');
                        gradient.addColorStop(1, 'rgba(136, 19, 55, 0.00)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.38,
                    borderWidth: 3.5,
                    pointBackgroundColor: '#881337',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#7f1d1d',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    order: 1,
                },
                {
                    type: 'bar' as const,
                    label: 'Stock Receipts (In)',
                    data: movementPoints.map((p) => p.stockIn),
                    backgroundColor: (context: any) => {
                        const ctx = context.chart?.ctx;
                        if (!ctx) return '#059669';
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, '#10b981');
                        gradient.addColorStop(1, '#047857');
                        return gradient;
                    },
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 2, bottomRight: 2 },
                    borderSkipped: false,
                    maxBarThickness: 26,
                    order: 2,
                },
                {
                    type: 'bar' as const,
                    label: 'RIS Issued (Out)',
                    data: movementPoints.map((p) => p.risIssued),
                    backgroundColor: (context: any) => {
                        const ctx = context.chart?.ctx;
                        if (!ctx) return '#e11d48';
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, '#f43f5e');
                        gradient.addColorStop(1, '#be123c');
                        return gradient;
                    },
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 2, bottomRight: 2 },
                    borderSkipped: false,
                    maxBarThickness: 26,
                    order: 3,
                },
            ],
        };
    }, [chartMode, waterfallSteps, movementPoints]);

    const movementChartOptions = useMemo<ChartOptions<any>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        animation: {
            duration: 600,
            easing: 'easeOutQuart',
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                cornerRadius: 10,
                padding: 14,
                titleFont: { size: 13, weight: 700, family: 'Inter, system-ui, sans-serif' },
                bodyFont: { size: 12, weight: 600, family: 'Inter, system-ui, sans-serif' },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    title: (items: any[]) => {
                        if (!items || items.length === 0) return '';
                        const idx = items[0].dataIndex;
                        if (chartMode === 'waterfall') {
                            return waterfallSteps[idx]?.fullTitle || items[0].label;
                        }
                        return `Period: ${items[0].label}`;
                    },
                    label: (context: any) => {
                        const idx = context.dataIndex;
                        if (chartMode === 'waterfall') {
                            const step = waterfallSteps[idx];
                            if (!step) return '';
                            if (step.type === 'start') {
                                return ` Beginning Inventory: ${step.amount.toLocaleString()} units`;
                            }
                            if (step.type === 'inflow') {
                                return ` Total Deliveries Added: +${step.amount.toLocaleString()} units (Level: ${step.range[0].toLocaleString()} → ${step.range[1].toLocaleString()})`;
                            }
                            if (step.type === 'outflow') {
                                return ` Total Dispatched via RIS: -${step.amount.toLocaleString()} units (Level: ${step.range[1].toLocaleString()} → ${step.range[0].toLocaleString()})`;
                            }
                            return ` Final Stock on Hand: ${step.amount.toLocaleString()} units`;
                        }

                        const dsLabel = context.dataset.label || '';
                        const val = Number(context.raw) || 0;
                        if (dsLabel.includes('Receipts')) {
                            return ` 📥 Deliveries Received (In): +${val.toLocaleString()} units`;
                        }
                        if (dsLabel.includes('RIS')) {
                            return ` 📤 Items Dispatched (RIS): -${val.toLocaleString()} units`;
                        }
                        return ` 📦 Stock on Hand Remaining: ${val.toLocaleString()} units`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 12, weight: 600, family: 'Inter, system-ui, sans-serif' },
                    padding: 8,
                },
                border: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                suggestedMax: 10,
                grid: {
                    color: 'rgba(226, 232, 240, 0.75)',
                    borderDash: [4, 4],
                    drawBorder: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 500, family: 'Inter, system-ui, sans-serif' },
                    padding: 10,
                    callback: (value: any) => Number(value).toLocaleString(),
                },
                border: {
                    dash: [4, 4],
                    display: false,
                },
            },
        },
    }), [chartMode, waterfallSteps, movementPoints]);

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
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden">
                        {/* Modern Top Header & Filter Controls */}
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-red-900 to-red-800 flex items-center justify-center text-white shadow-xs ring-4 ring-red-50 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                                            Inventory Movement & Flow Analytics
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70 shadow-2xs">
                                            {chartMode === 'flow' ? 'Timeline Flow' : chartMode === 'waterfall' ? 'Reconciliation Waterfall' : 'Data Ledger'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Live reconciliation of supplier deliveries, university office RIS issuances, and balance on hand
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Segmented Tab Switcher (Apple/Linear style) */}
                                <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 shadow-2xs text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('flow')}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                            chartMode === 'flow'
                                                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                                                : 'text-slate-500 hover:text-slate-900 font-semibold'
                                        }`}
                                        title="Timeline flow of stock receipts vs department issuances"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span>Monthly Flow</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('waterfall')}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                            chartMode === 'waterfall'
                                                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                                                : 'text-slate-500 hover:text-slate-900 font-semibold'
                                        }`}
                                        title="4-Step Inventory Equation Waterfall"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span>Balance Waterfall</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('ledger')}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                            chartMode === 'ledger'
                                                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                                                : 'text-slate-500 hover:text-slate-900 font-semibold'
                                        }`}
                                        title="Tabular ledger summary"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span>Ledger Table</span>
                                    </button>
                                </div>

                                {/* Timeframe Select */}
                                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto z-10">
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
                                                className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-red-900 focus:ring-1 focus:ring-red-900 focus:outline-none shadow-2xs"
                                                aria-label="Custom range start date"
                                            />
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-red-900 focus:ring-1 focus:ring-red-900 focus:outline-none shadow-2xs"
                                                aria-label="Custom range end date"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCustomRange}
                                                className="rounded-lg bg-red-900 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-950 shadow-xs uppercase tracking-wider"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Modern Guide & Formula Bar */}
                        <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
                                    <span>Deliveries Received (+)</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100"></span>
                                    <span>RIS Dispatched (-)</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                    <span className="w-3.5 h-1.5 rounded-full bg-red-900"></span>
                                    <span>Stock Balance Curve</span>
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                                <span className="text-slate-400">Reconciliation:</span>
                                <span className="text-slate-700">{movementSummary.startingStock.toLocaleString()}</span>
                                <span className="text-emerald-700 font-bold">+{movementSummary.totalStockIn.toLocaleString()}</span>
                                <span className="text-rose-700 font-bold">-{movementSummary.totalRisIssued.toLocaleString()}</span>
                                <span className="text-slate-400">=</span>
                                <span className="text-red-950 font-extrabold">{movementSummary.endingStock.toLocaleString()} Available</span>
                            </div>
                        </div>

                        {/* Executive KPI Metric Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-5 bg-gradient-to-b from-slate-50/50 to-white border-b border-slate-100">
                            {/* 1. Beginning Stock */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Beginning Stock</span>
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                        {movementSummary.startingStock.toLocaleString()} <span className="text-xs font-semibold text-slate-400">units</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Inventory level at start</p>
                                </div>
                            </div>

                            {/* 2. Stock Receipts (In) */}
                            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-white via-white to-emerald-50/30 hover:border-emerald-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">(+) Stock Received</span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                                        +{movementSummary.totalStockIn.toLocaleString()} <span className="text-xs font-semibold text-emerald-600/80">units</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Total deliveries received</p>
                                </div>
                            </div>

                            {/* 3. Total Stock Out */}
                            <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-white via-white to-rose-50/30 hover:border-rose-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">(-) Total Dispatched</span>
                                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800 text-xs">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
                                        -{movementSummary.totalRisIssued.toLocaleString()} <span className="text-xs font-semibold text-rose-600/80">units</span>
                                    </div>
                                    <p className="text-[11px] text-rose-700 font-medium mt-0.5">Issued via RIS to offices</p>
                                </div>
                            </div>

                            {/* 4. Net Flow Delta */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Movement</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${movementSummary.netChange >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className={`text-2xl font-extrabold tracking-tight ${movementSummary.netChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {movementSummary.netChange >= 0 ? `+${movementSummary.netChange.toLocaleString()}` : movementSummary.netChange.toLocaleString()} <span className="text-xs font-semibold text-slate-400">units</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        {movementSummary.netChange >= 0 ? 'Net stock increase' : 'Net stock decrease'}
                                    </p>
                                </div>
                            </div>

                            {/* 5. Available Stock Hero Tile (University Maroon Gradient) */}
                            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-red-900 via-red-950 to-slate-950 text-white p-4 rounded-xl shadow-md ring-1 ring-black/10 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-600/20 rounded-full blur-xl pointer-events-none"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">(=) Available Stock</span>
                                    <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center text-white text-xs">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-2 relative z-10">
                                    <div className="text-2xl font-black text-white tracking-tight">
                                        {movementSummary.endingStock.toLocaleString()} <span className="text-xs font-medium text-red-200">units</span>
                                    </div>
                                    <p className="text-[11px] text-red-200/90 font-medium mt-0.5">Current on-hand inventory</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area: High-End Canvas or Modern Table */}
                        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white">
                            {customRangeError ? (
                                <div className="mb-4 w-full max-w-6xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800 shadow-2xs">
                                    {customRangeError}
                                </div>
                            ) : null}

                            {chartMode === 'ledger' ? (
                                /* Ultra-Modern Monthly Ledger Table */
                                <div className="w-full max-w-6xl mx-auto overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 border border-slate-200/80 rounded-xl overflow-hidden text-xs shadow-2xs">
                                        <thead className="bg-slate-50/90">
                                            <tr>
                                                <th className="px-5 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">Period / Month</th>
                                                <th className="px-5 py-3.5 text-right font-bold text-slate-700 uppercase tracking-wider">Starting Balance</th>
                                                <th className="px-5 py-3.5 text-right font-bold text-emerald-800 uppercase tracking-wider">Stock Received (+)</th>
                                                <th className="px-5 py-3.5 text-right font-bold text-rose-800 uppercase tracking-wider">RIS Issued (-)</th>
                                                <th className="px-5 py-3.5 text-right font-bold text-slate-700 uppercase tracking-wider">Net Movement</th>
                                                <th className="px-5 py-3.5 text-right font-bold text-red-950 uppercase tracking-wider">Ending Stock</th>
                                                <th className="px-5 py-3.5 text-center font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {movementPoints.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-medium">
                                                        No movement records found for the selected period.
                                                    </td>
                                                </tr>
                                            ) : (
                                                movementPoints.map((p, idx) => {
                                                    const net = p.stockIn - p.risIssued;
                                                    const endStock = p.starting + net;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-5 py-3.5 font-bold text-slate-900">{p.label}</td>
                                                            <td className="px-5 py-3.5 text-right font-mono text-slate-600">{p.starting.toLocaleString()} pcs</td>
                                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">+{p.stockIn.toLocaleString()} pcs</td>
                                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700">-{p.risIssued.toLocaleString()} pcs</td>
                                                            <td className="px-5 py-3.5 text-right font-mono font-bold">
                                                                <span className={`px-2.5 py-0.5 rounded-md text-[11px] ${net >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                                                    {net >= 0 ? `+${net.toLocaleString()}` : net.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right font-mono font-extrabold text-red-950">{endStock.toLocaleString()} pcs</td>
                                                            <td className="px-5 py-3.5 text-center">
                                                                {p.stockIn > p.risIssued ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                                        <span>Stock Added</span>
                                                                    </span>
                                                                ) : p.risIssued > p.stockIn ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                                                        <span>Dispatches</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80">
                                                                        <span>Balanced</span>
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Interactive Chart Canvas */
                                <>
                                    <div className="w-full h-[330px] px-2 max-w-6xl mx-auto">
                                        <Chart type="bar" data={movementChartData} options={movementChartOptions} />
                                    </div>
                                    {movementPoints.length === 0 ? (
                                        <p className="mt-4 text-xs font-semibold text-slate-400">No movement data found for the selected view.</p>
                                    ) : null}

                                    {/* Modern Dynamic Pill Legend */}
                                    <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100 w-full justify-center text-xs font-bold uppercase tracking-wider">
                                        {chartMode === 'waterfall' && (
                                            <>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-slate-500"></div>
                                                    <span className="text-slate-700">1. Starting Stock: <span className="font-mono text-slate-900">{movementSummary.startingStock.toLocaleString()}</span></span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
                                                    <span className="text-emerald-900">2. (+) Total Received: <span className="font-mono font-extrabold text-emerald-800">+{movementSummary.totalStockIn.toLocaleString()}</span></span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50/60 border border-rose-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-rose-500"></div>
                                                    <span className="text-rose-900">3. (-) Total Issued: <span className="font-mono font-extrabold text-rose-800">-{movementSummary.totalRisIssued.toLocaleString()}</span></span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50/60 border border-red-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-red-900"></div>
                                                    <span className="text-red-950">4. (=) Stock on Hand: <span className="font-mono font-extrabold text-red-950">{movementSummary.endingStock.toLocaleString()}</span></span>
                                                </div>
                                            </>
                                        )}
                                        {chartMode === 'flow' && (
                                            <>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
                                                    <span className="text-emerald-900">Deliveries (In): <span className="font-mono font-extrabold text-emerald-800">+{movementSummary.totalStockIn.toLocaleString()}</span></span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50/60 border border-rose-200/80 shadow-2xs">
                                                    <div className="w-3 h-3 rounded-md bg-rose-500"></div>
                                                    <span className="text-rose-900">RIS Dispatched (Out): <span className="font-mono font-extrabold text-rose-800">-{movementSummary.totalRisIssued.toLocaleString()}</span></span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50/60 border border-red-200/80 shadow-2xs">
                                                    <div className="w-4 h-1.5 rounded-full bg-red-900"></div>
                                                    <span className="text-red-950">Current Stock Balance: <span className="font-mono font-extrabold text-red-950">{movementSummary.endingStock.toLocaleString()}</span></span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
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