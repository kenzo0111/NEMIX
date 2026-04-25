import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
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
    chartData = { monthly: [0, 0, 0, 0, 0, 0, 0, 0], yearly: [0, 0, 0, 0, 0, 0, 0, 0], custom: [] },
    lowStockAlerts = [],
    auditLogs = [],
    roles = [],
    filters = { chartFilter: 'monthly', customStartDate: '', customEndDate: '' },
}: { 
    auth: any;
    stats?: { totalInventoryValue: string; totalRisIssued: number; itemsIssuedMtd: number; unserviceable: number; criticalAlerts: number; activeInventoryItems?: number; };
    chartData?: { monthly: MovementInputPoint[]; yearly: MovementInputPoint[]; custom?: MovementInputPoint[]; };
    lowStockAlerts?: Array<{ name: string; sku: string; current: number; min: number; unit: string; priority: string; }>;
    auditLogs?: Array<{ user: string; role: string; action: string; details: string; id: string; status: string; time: string; badge: string; }>;
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

    // State for Audit Trail Role Filter
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<{ value: string; label: string } | null>(null);

    const chartFilterOptions = [
        { value: 'monthly', label: 'Monthly View (Last 6 Mos)' },
        { value: 'yearly', label: 'Yearly View' },
        { value: 'custom', label: 'Custom Range...' },
    ];

    const roleFilterOptions = roles && roles.length > 0 ? roles : [
        { value: '', label: 'All Roles' },
        { value: 'System Admin', label: 'System Admin' },
        { value: 'Internal Auditor', label: 'Internal Auditor' },
        { value: 'External Auditor', label: 'External Auditor' },
        { value: 'Property Staff', label: 'Property Staff' },
    ];

    const selectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            padding: '2px 8px',
            minWidth: '200px',
            boxShadow: state.isFocused ? '0 0 0 1px #fee2e2' : 'none',
            '&:hover': { borderColor: '#dc2626' },
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#4b5563',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fff1f1' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            padding: '10px 12px',
            fontSize: '0.875rem',
            fontWeight: '600',
        }),
    };

    const auditTrailLogs = auditLogs && auditLogs.length > 0 ? auditLogs : [
        { user: 'Vince Balce', role: 'System Admin', action: 'Certified Unserviceable Assets', details: 'Added 5 items to disposal list', id: 'TRX-1006', status: 'Verified', time: '15 mins ago', badge: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
        { user: 'Maria Santos', role: 'Internal Auditor', action: 'Exported Annual Supply Report', details: 'Generated PDF report for 2025', id: 'TRX-1007', status: 'Logged', time: '1 hour ago', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' },
        { user: 'Staff Member', role: 'Property Staff', action: 'Overrode Stock Level Warning', details: 'Authorized release of low-stock items', id: 'TRX-1008', status: 'Flagged', time: '3 hours ago', badge: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' },
        { user: 'System Auditor', role: 'External Auditor', action: 'Initiated Inventory Reconciliation', details: 'Started monthly cycle count', id: 'TRX-1009', status: 'In Progress', time: '5 hours ago', badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' },
        { user: 'Admin User', role: 'System Admin', action: 'Updated Asset Category Schema', details: 'Modified depreciation schedules', id: 'TRX-1010', status: 'Verified', time: '1 day ago', badge: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
    ];

    const filteredAuditLogs = useMemo(() => {
        return auditTrailLogs.filter(log => {
            if (!selectedRoleFilter?.value) return true;
            return log.role === selectedRoleFilter.value;
        });
    }, [selectedRoleFilter]);

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
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 28,
            },
            {
                label: 'Stock In',
                data: movementPoints.map((point) => point.stockIn),
                backgroundColor: '#7f1d1d',
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 28,
            },
            {
                label: 'RIS Issued',
                data: movementPoints.map((point) => point.risIssued),
                backgroundColor: '#facc15',
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 28,
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
                cornerRadius: 10,
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
                grid: {
                    color: 'rgba(148, 163, 184, 0.18)',
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 600 },
                },
            },
        },
    }), []);

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
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="CNSC Supply & Inventory Management Dashboard" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-5 flex items-center justify-between">
                    <div>
                        <div className="mb-2">
                            <Breadcrumbs items={[]} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Supply & Inventory Management</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-10 max-w-[1600px] mx-auto pb-20">
                    
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-950 to-red-900 text-white shadow-lg border border-red-800/50">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 px-10 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-red-950/50 border border-red-700/50 text-xs font-bold text-yellow-300 mb-6 backdrop-blur-md shadow-inner">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    System Status: Operational & Secure
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight tracking-tight text-white">
                                    Welcome back, {user.name.split(' ')[0]}
                                </h1>
                                <p className="text-red-100/90 text-lg md:text-xl font-medium leading-relaxed">
                                    The system is currently tracking <strong className="text-white">{new Intl.NumberFormat('en-US').format(stats.activeInventoryItems ?? 0)} active inventory items</strong> with real-time stock monitoring.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                                <Link 
                                    href={route('compliance.analytics')} 
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-950 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-yellow-50 transition-all shadow-md hover:shadow-lg"
                                >
                                    <span>Inventory Analytics</span>
                                    <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
                        {[
                            { label: 'Total Inventory Value', value: stats.totalInventoryValue ?? '₱0', sub: 'Across All Items', trend: '+5.2%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: '📦' },
                            { label: 'Total RIS Issued', value: stats.totalRisIssued ?? 0, sub: 'Completed Requests', trend: 'Lifetime', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: '📜' },
                            { label: 'Items Issued (MTD)', value: stats.itemsIssuedMtd ?? 0, sub: 'Current Month', trend: '+18%', trendUp: true, color: 'text-green-600', bg: 'bg-green-50/50', icon: '📤' },
                            { label: 'Unserviceable', value: stats.unserviceable ?? 0, sub: 'Out of Stock Items', trend: 'Needs Check', trendUp: false, color: 'text-orange-600', bg: 'bg-orange-50/50', icon: '♻️' },
                            { label: 'Critical Stock Alerts', value: stats.criticalAlerts ?? 0, sub: 'Requires Reordering', trend: 'Urgent', trendUp: false, color: 'text-red-600', bg: 'bg-red-50/50', icon: '⚠️' },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} ring-1 ring-gray-900/5 group-hover:scale-110 transition-transform duration-300 text-xl`}>
                                        {stat.icon}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stat.trendUp ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-0.5">{stat.value}</h3>
                                    <p className="text-sm font-bold text-gray-700 truncate">{stat.label}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Movement Analytics Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Movement Analytics</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Stock In vs. RIS Issuances</p>
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
                                            className="w-full sm:w-auto rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:border-red-300 focus:outline-none"
                                            aria-label="Custom range start date"
                                        />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full sm:w-auto rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:border-red-300 focus:outline-none"
                                            aria-label="Custom range end date"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyCustomRange}
                                            className="rounded-xl bg-red-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-800"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        
                        <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[400px] bg-gray-50/30">
                            {customRangeError ? (
                                <div className="mb-4 w-full max-w-6xl rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                                    {customRangeError}
                                </div>
                            ) : null}
                            <div className="w-full h-[320px] px-2 max-w-6xl mx-auto">
                                <Bar data={movementChartData} options={movementChartOptions} />
                            </div>
                            {chartFilter === 'custom' && movementPoints.length === 0 ? (
                                <p className="mt-4 text-sm font-semibold text-gray-500">No movement data found for the selected custom date range.</p>
                            ) : null}
                            <div className="flex gap-10 mt-10">
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div><span className="text-sm text-gray-600 font-bold">Starting Stock</span></div>
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-red-900/90"></div><span className="text-sm text-gray-600 font-bold">Stock In</span></div>
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-yellow-400"></div><span className="text-sm text-gray-600 font-bold">RIS Issued</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock & Reorder Alerts - Bento Style */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Reorder Monitoring</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Items currently below minimum safety stock levels</p>
                            </div>
                            <Link 
                                href={route('inventory.index')} // Or a specific filtered route
                                className="text-sm font-bold text-red-900 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-colors"
                            >
                                View All Alerts
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            {(lowStockAlerts && lowStockAlerts.length > 0 ? lowStockAlerts : [
                                { name: 'A4 Copier Paper (80gsm)', sku: 'SUP-PAP-001', current: 12, min: 50, unit: 'Reams', priority: 'Critical' },
                                { name: 'HP Laser Jet Toner 85A', sku: 'SUP-TON-085', current: 2, min: 10, unit: 'Units', priority: 'Critical' },
                                { name: 'Ballpoint Pen (Black)', sku: 'SUP-PEN-002', current: 45, min: 100, unit: 'Pieces', priority: 'Warning' },
                            ]).map((item, i) => (
                                <div key={i} className="p-8 hover:bg-gray-50/50 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                                                item.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {item.priority}
                                            </span>
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{item.sku}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-3xl font-black text-gray-900">{item.current}</span>
                                                <span className="text-sm font-bold text-gray-500 ml-1.5">/ {item.min} {item.unit}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-red-600">-{((item.min - item.current) / item.min * 100).toFixed(0)}% Deficit</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    item.priority === 'Critical' ? 'bg-red-600' : 'bg-orange-500'
                                                } ${getProgressWidthClass(item.current, item.min)}`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refined System Audit Trail for Admins, Staff, and Auditors */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Manage Transaction</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Verified activity log for administrative and oversight review</p>
                            </div>
                            <div className="flex gap-3">
                                <Select 
                                    options={roleFilterOptions}
                                    value={selectedRoleFilter}
                                    onChange={setSelectedRoleFilter}
                                    styles={selectStyles}
                                    placeholder="Filter by Role"
                                    isClearable
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Authorized User</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Action Performed</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Resource Ref</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Audit Status</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredAuditLogs.length > 0 ? (
                                        filteredAuditLogs.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-red-50 group-hover:text-red-900 transition-colors">
                                                        {row.user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{row.user}</div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{row.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-700">{row.action}</div>
                                                <div className="text-xs text-gray-500">{row.details}</div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                                                    {row.id}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${row.badge}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-semibold">{row.time}</td>
                                        </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <p className="text-gray-500 font-medium">No activity logs match your filter.</p>
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