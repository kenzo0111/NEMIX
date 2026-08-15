import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    Tooltip,
    type ChartData,
    type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type InventoryAnalyticsItem = {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unitCost: number;
    amount: number;
    status: string;
    unitOfIssue: string;
    description?: string | null;
};

type InventoryAnalyticsProps = {
    stats: {
        totalItems: number;
        totalStock: number;
        lowStockAlerts: number;
        outOfStock: number;
        totalValue: string;
        highestConsumable: string;
        lowestConsumable: string;
    };
    items: InventoryAnalyticsItem[];
    lowStockItems: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'amount'>>;
    consumables: {
        highest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
        lowest: Array<Pick<InventoryAnalyticsItem, 'id' | 'name' | 'sku' | 'stock' | 'unitOfIssue' | 'status'>>;
    };
    statusCounts: {
        Available: number;
        'Low Stock': number;
        'Out of Stock': number;
    };
    chartData: {
        stockItems: Array<{ label: string; value: number; meta: string; color: string }>;
        valueItems: Array<{ label: string; value: number; meta: string; color: string }>;
        lowStockItems: Array<{ label: string; value: number; meta: string; color: string }>;
        statusSeries: Array<{ label: string; value: number; color: string }>;
    };
};

const fallbackAnalytics: InventoryAnalyticsProps = {
    stats: {
        totalItems: 0,
        totalStock: 0,
        lowStockAlerts: 0,
        outOfStock: 0,
        totalValue: '₱0.00',
        highestConsumable: 'N/A',
        lowestConsumable: 'N/A',
    },
    items: [],
    lowStockItems: [],
    consumables: {
        highest: [],
        lowest: [],
    },
    statusCounts: {
        Available: 0,
        'Low Stock': 0,
        'Out of Stock': 0,
    },
    chartData: {
        stockItems: [],
        valueItems: [],
        lowStockItems: [],
        statusSeries: [],
    },
};

function formatCurrency(value: number) {
    return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BarChartCard({
    title,
    subtitle,
    items,
    formatValue,
}: {
    title: string;
    subtitle: string;
    items: Array<{ label: string; value: number; meta: string; color: string }>;
    formatValue: (value: number) => string;
}) {
    const hasData = items.length > 0;
    const labels = items.map((item) => item.label);
    const values = items.map((item) => item.value);
    const colors = items.map((item) => item.color);
    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const compactNumber = new Intl.NumberFormat('en-PH', {
        notation: 'compact',
        maximumFractionDigits: 1,
    });

    const data: ChartData<'bar'> = {
        labels,
        datasets: [
            {
                data: values,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.75,
                categoryPercentage: 0.75,
                maxBarThickness: 24,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 650,
            easing: 'easeOutCubic',
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                displayColors: false,
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 12, weight: 700 },
                bodyFont: { size: 12, weight: 600 },
                callbacks: {
                    title: (tooltipItems) => tooltipItems[0]?.label ?? '',
                    label: (context) => {
                        const value = context.parsed.x ?? 0;
                        return formatValue(value);
                    },
                    afterLabel: (context) => {
                        const idx = context.dataIndex;
                        return items[idx]?.meta ?? '';
                    },
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(148, 163, 184, 0.18)',
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: 600 },
                    callback: (value) => compactNumber.format(Number(value)),
                },
            },
            y: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: 600 },
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">{title}</h4>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">{subtitle}</p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {hasData ? (
                    <>
                        <div className="h-72 rounded border border-gray-200 bg-gray-50/50 p-4">
                            <Bar data={data} options={options} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {items.map((item) => (
                                <div key={`${title}-${item.label}`} className="rounded border border-gray-200 bg-gray-50/70 px-3.5 py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                                <p className="text-xs font-bold text-gray-900 truncate">{item.label}</p>
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 truncate">{item.meta}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-gray-900 font-mono">{formatValue(item.value)}</p>
                                            <p className="text-[10px] font-bold text-gray-500 font-mono">{totalValue > 0 ? `${((item.value / totalValue) * 100).toFixed(1)}%` : '0.0%'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs font-medium text-gray-500">
                        No chart data available.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusDonutChart({
    title,
    subtitle,
    series,
}: {
    title: string;
    subtitle: string;
    series: Array<{ label: string; value: number; color: string }>;
}) {
    const total = series.reduce((sum, item) => sum + item.value, 0);
    const hasData = total > 0;

    const data: ChartData<'doughnut'> = {
        labels: series.map((item) => item.label),
        datasets: [
            {
                data: series.map((item) => item.value),
                backgroundColor: series.map((item) => item.color),
                borderColor: '#ffffff',
                borderWidth: 3,
                spacing: 2,
                hoverOffset: 6,
            },
        ],
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        animation: {
            duration: 700,
            easing: 'easeOutCubic',
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                displayColors: false,
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 12, weight: 700 },
                bodyFont: { size: 12, weight: 600 },
                callbacks: {
                    label: (context) => {
                        const value = Number(context.raw ?? 0);
                        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${context.label}: ${value} (${percent}%)`;
                    },
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100/90">
                <h4 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">{title}</h4>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{subtitle}</p>
            </div>

            <div className="p-6">
                {hasData ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative h-52 w-52">
                            <Doughnut data={data} options={options} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-gray-900 font-sans">{total}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Total items</span>
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3">
                            {series.map((item) => (
                                <div key={item.label} className="rounded border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                                            <circle cx="5" cy="5" r="5" fill={item.color} />
                                        </svg>
                                        <p className="text-xs font-bold text-gray-900">{item.label}</p>
                                    </div>
                                    <div className="mt-2 flex items-end justify-between gap-3">
                                        <p className="text-xl font-bold text-gray-900 font-mono">{item.value}</p>
                                        <p className="text-[10px] font-bold text-gray-500 font-mono">{total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0.0%'}</p>
                                    </div>
                                    <div className="mt-2 h-1 rounded bg-gray-200" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs font-medium text-gray-500">
                        No status data available.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ManageAnalytics({ auth }: { auth: any }) {
    const { props } = usePage<{ auth: any; analytics?: InventoryAnalyticsProps }>();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showAllItems, setShowAllItems] = useState(false);
    const analytics = props.analytics ?? fallbackAnalytics;
    const chartData = analytics.chartData ?? fallbackAnalytics.chartData;
    const allItems = analytics.items ?? fallbackAnalytics.items;

    const modules = getSidebarModules('Compliance', 'Manage Analytics');

    const overviewCards = [
        {
            label: 'Total Items Registered',
            value: analytics.stats.totalItems,
            sub: 'Active records in database',
            icon: (
                <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'text-red-900',
            bg: 'bg-red-50',
            trend: 'Click View',
            trendUp: true,
            clickable: true,
        },
        {
            label: 'Total Stock Quantity',
            value: analytics.stats.totalStock,
            sub: 'Combined inventory units',
            icon: (
                <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'text-blue-900',
            bg: 'bg-blue-50',
            trend: 'Active',
            trendUp: true,
        },
        {
            label: 'Low Stock Alerts',
            value: analytics.stats.lowStockAlerts,
            sub: 'Items near safety limit',
            icon: (
                <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'text-amber-800',
            bg: 'bg-amber-50',
            trend: 'Needs Action',
            trendUp: false,
        },
        {
            label: 'Out of Stock',
            value: analytics.stats.outOfStock,
            sub: 'Unavailable for issuance',
            icon: (
                <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            ),
            color: 'text-red-700',
            bg: 'bg-red-50',
            trend: 'Critical',
            trendUp: false,
        },
        {
            label: 'Total Inventory Valuation',
            value: analytics.stats.totalValue,
            sub: 'Calculated stored item value',
            icon: (
                <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-emerald-800',
            bg: 'bg-emerald-50',
            trend: 'Audited',
            trendUp: true,
        },
        {
            label: 'Top Stock Consumable',
            value: analytics.stats.highestConsumable,
            sub: 'Highest volume on-hand',
            icon: (
                <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            color: 'text-red-900',
            bg: 'bg-red-50',
            trend: 'Leader',
            trendUp: true,
        },
    ];

    const statusBars = [
        { label: 'Available', value: analytics.statusCounts.Available, color: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
        { label: 'Low Stock', value: analytics.statusCounts['Low Stock'], color: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200' },
        { label: 'Out of Stock', value: analytics.statusCounts['Out of Stock'], color: 'bg-red-500', badgeClass: 'bg-red-50 text-red-800 border border-red-200' },
    ];

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Inventory Performance Analytics" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">University Enterprise Administrative System</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <span>SYSTEM MODE: LIVE PRODUCTION</span>
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Compliance' }, { name: 'Manage Analytics' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Inventory Performance Analytics</h2>
                            <p className="text-xs text-gray-500 font-medium">Live Metrics, Item Valuation, Stock Distribution & Inventory Watchlists</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5 font-mono">
                                    DATA SOURCE: ITEMS TABLE
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* System Overview Banner */}
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
                                    University Inventory Performance & Valuation Report
                                </h1>
                                <p className="text-red-100/90 text-sm font-normal leading-relaxed">
                                    Real-time inventory metrics calculated directly from recorded items, tracking total valuation of <strong className="text-white">{analytics.stats.totalValue}</strong>, stock availability distributions, and safety threshold alerts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                                {statusBars.map((status) => (
                                    <div key={status.label} className="rounded bg-red-900/80 border border-red-800 px-4 py-3 min-w-[130px]">
                                        <p className="text-[10px] uppercase tracking-wider text-red-200/90 font-bold font-mono">{status.label}</p>
                                        <div className="mt-1 flex items-end justify-between gap-3">
                                            <span className="text-2xl font-bold text-white font-mono">{status.value}</span>
                                            <span className={`h-2 w-2 rounded-full ${status.color}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
                        {overviewCards.map((stat, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={stat.clickable ? () => setShowAllItems(true) : undefined}
                                className={`bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between text-left transition-all ${stat.clickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-900' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2.5">
                                    <div className={`p-2 rounded ${stat.bg} border border-gray-200`}>
                                        {stat.icon}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${stat.trendUp ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight font-sans truncate">{stat.value}</h3>
                                    <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">{stat.label}</p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{stat.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Analytics Charts Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <BarChartCard
                                title="Stock Quantity by Item"
                                subtitle="Top items ranked by current available stock on hand."
                                items={chartData.stockItems}
                                formatValue={(value) => `${value.toLocaleString('en-PH')} units`}
                            />

                            <BarChartCard
                                title="Inventory Valuation by Item"
                                subtitle="Top registered items ranked by calculated financial value."
                                items={chartData.valueItems}
                                formatValue={formatCurrency}
                            />
                        </div>

                        <div className="space-y-6">
                            <StatusDonutChart
                                title="Inventory Status Breakdown"
                                subtitle="Current stock status distribution across all records."
                                series={chartData.statusSeries}
                            />

                            <BarChartCard
                                title="Low Stock Watchlist"
                                subtitle="Critical items requiring immediate stock replenishment."
                                items={chartData.lowStockItems}
                                formatValue={(value) => `${value.toLocaleString('en-PH')} units`}
                            />
                        </div>
                    </div>

                    {/* Consumables Summary Watchlist Section */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden p-6">
                        <div className="px-6 py-4 -mx-6 -mt-6 mb-6 bg-gray-100/90 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">Consumable Movement & Stock Extremes</h4>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Automated identification of highest and lowest inventory volume items</p>
                            </div>
                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
                                Total Stored Valuation: <span className="text-red-950 font-extrabold">{analytics.stats.totalValue}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="rounded border border-gray-200 bg-gray-50/50 p-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-mono">Highest Stock Consumables</h5>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">Top 5</span>
                                </div>
                                <div className="mt-3 space-y-2.5">
                                    {analytics.consumables.highest.length > 0 ? (
                                        analytics.consumables.highest.map((item, index) => (
                                            <div key={`high-${item.id}`} className="rounded border border-gray-200 bg-white p-3 flex items-center justify-between gap-3 shadow-2xs">
                                                <div className="min-w-0 flex items-center gap-3">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950 text-amber-300 border border-red-900 shrink-0">
                                                        #{index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-[11px] font-mono text-gray-500 truncate">SKU: {item.sku}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 font-mono shrink-0 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                                                    {item.stock.toLocaleString('en-PH')} {item.unitOfIssue}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500 font-medium">
                                            No data recorded.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded border border-gray-200 bg-gray-50/50 p-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-mono">Lowest Stock Consumables</h5>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">Watchlist</span>
                                </div>
                                <div className="mt-3 space-y-2.5">
                                    {analytics.consumables.lowest.length > 0 ? (
                                        analytics.consumables.lowest.map((item, index) => (
                                            <div key={`low-${item.id}`} className="rounded border border-gray-200 bg-white p-3 flex items-center justify-between gap-3 shadow-2xs">
                                                <div className="min-w-0 flex items-center gap-3">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                                                        #{index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-[11px] font-mono text-gray-500 truncate">SKU: {item.sku}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 font-mono shrink-0 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                                                    {item.stock.toLocaleString('en-PH')} {item.unitOfIssue}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500 font-medium">
                                            No data recorded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* All Items Detail Modal */}
            <Modal show={showAllItems} onClose={() => setShowAllItems(false)} maxWidth="4xl">
                <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white shadow-2xl border border-gray-200">
                    {/* Institutional Accent Bar */}
                    <div className="h-1.5 w-full flex-shrink-0 bg-red-950" />

                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-100 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="rounded bg-red-950 p-2 text-amber-300 border border-red-900">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6M7 5h10a2 2 0 012 2v12l-3-2-3 2-3-2-3 2V7a2 2 0 012-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight text-gray-900 font-serif">All Inventory Items Database</h3>
                                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Live Item Records Breakdown</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAllItems(false)}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                            aria-label="Close all items list"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className="mb-4 flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs text-red-950 font-mono">
                            <span className="font-bold">Total Items Count: {allItems.length}</span>
                            <span className="text-red-800">Showing all records from inventory items database</span>
                        </div>

                        <div className="hidden md:block overflow-hidden rounded border border-gray-200">
                            <div className="max-h-[55vh] overflow-auto">
                                <table className="min-w-full divide-y divide-gray-200 bg-white">
                                    <thead className="sticky top-0 bg-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wider font-mono border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Item Name</th>
                                            <th className="px-4 py-3 text-left">SKU</th>
                                            <th className="px-4 py-3 text-left">Stock</th>
                                            <th className="px-4 py-3 text-left">Unit Cost</th>
                                            <th className="px-4 py-3 text-left">Total Value</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {allItems.length > 0 ? (
                                            allItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-4 py-3.5 align-top">
                                                        <div className="max-w-[16rem]">
                                                            <p className="font-bold text-gray-900 text-xs break-words">{item.name}</p>
                                                            <p className="mt-0.5 text-[11px] text-gray-500 break-words">{item.description || 'No description recorded.'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 align-top text-xs font-mono text-gray-600">{item.sku || 'N/A'}</td>
                                                    <td className="px-4 py-3.5 align-top text-xs font-bold font-mono text-gray-900">{Number(item.stock || 0).toLocaleString('en-PH')}</td>
                                                    <td className="px-4 py-3.5 align-top text-xs font-mono text-gray-700">{formatCurrency(Number(item.unitCost || 0))}</td>
                                                    <td className="px-4 py-3.5 align-top text-xs font-bold font-mono text-gray-900">{formatCurrency(Number(item.amount || 0))}</td>
                                                    <td className="px-4 py-3.5 align-top">
                                                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${item.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : item.status === 'Low Stock' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 align-top text-xs font-mono text-gray-700">{item.unitOfIssue || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-10 text-center text-xs text-gray-500 font-medium">
                                                    No item records found in database.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="grid gap-3 md:hidden">
                            {allItems.length > 0 ? (
                                allItems.map((item) => (
                                    <div key={item.id} className="rounded border border-gray-200 bg-white p-4 shadow-2xs">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-xs break-words">{item.name}</p>
                                                <p className="mt-0.5 text-[11px] font-mono text-gray-500 break-words">SKU: {item.sku || 'N/A'}</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${item.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : item.status === 'Low Stock' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400">Stock</p>
                                                <p className="font-bold text-gray-900">{Number(item.stock || 0).toLocaleString('en-PH')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400">Unit</p>
                                                <p className="font-bold text-gray-900">{item.unitOfIssue || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400">Unit Cost</p>
                                                <p className="font-bold text-gray-900">{formatCurrency(Number(item.unitCost || 0))}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400">Amount</p>
                                                <p className="font-bold text-gray-900">{formatCurrency(Number(item.amount || 0))}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs text-gray-500 font-medium">
                                    No item records found in database.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
