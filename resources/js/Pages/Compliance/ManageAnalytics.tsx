import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

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
    const maxValue = Math.max(...items.map((item) => item.value), 1);

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-7 py-6 border-b border-gray-100">
                <h4 className="text-lg font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>

            <div className="p-6 space-y-4">
                {items.length > 0 ? (
                    items.map((item) => {
                        const barWidth = Math.max((item.value / maxValue) * 1000, 40);

                        return (
                            <div key={`${title}-${item.label}`} className="space-y-2">
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{item.label}</p>
                                        <p className="text-xs text-gray-500 truncate">{item.meta}</p>
                                    </div>
                                    <span className="font-bold text-gray-900 shrink-0">{formatValue(item.value)}</span>
                                </div>
                                <svg viewBox="0 0 1000 16" className="h-3 w-full overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`${item.label} chart bar`}>
                                    <rect x="0" y="0" width="1000" height="16" rx="8" fill="#e5e7eb" />
                                    <rect x="0" y="0" width={barWidth} height="16" rx="8" fill={item.color} />
                                </svg>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
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
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-7 py-6 border-b border-gray-100">
                <h4 className="text-lg font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>

            <div className="p-6">
                {total > 0 ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative h-56 w-56">
                            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
                                <circle cx="90" cy="90" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="18" />
                                {series.map((item) => {
                                    const segment = (item.value / total) * circumference;
                                    const circle = (
                                        <circle
                                            key={item.label}
                                            cx="90"
                                            cy="90"
                                            r={radius}
                                            fill="none"
                                            stroke={item.color}
                                            strokeWidth="18"
                                            strokeDasharray={`${segment} ${circumference - segment}`}
                                            strokeDashoffset={-offset}
                                            strokeLinecap="round"
                                        />
                                    );
                                    offset += segment;
                                    return circle;
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold text-gray-900">{total}</span>
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Items</span>
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3">
                            {series.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                            <circle cx="6" cy="6" r="6" fill={item.color} />
                                        </svg>
                                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
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
    const analytics = props.analytics ?? fallbackAnalytics;
    const chartData = analytics.chartData ?? fallbackAnalytics.chartData;
    
    const modules = getSidebarModules('Inventory', 'Manage Analytics');

    const overviewCards = [
        {
            label: 'Total Items',
            value: analytics.stats.totalItems,
            sub: 'Records in the items database',
            icon: '📦',
            color: 'text-red-700',
            bg: 'bg-red-50',
        },
        {
            label: 'Total Stock',
            value: analytics.stats.totalStock,
            sub: 'Combined quantity across all items',
            icon: '📊',
            color: 'text-blue-700',
            bg: 'bg-blue-50',
        },
        {
            label: 'Low Stock Alerts',
            value: analytics.stats.lowStockAlerts,
            sub: 'Items requiring reordering',
            icon: '⚠️',
            color: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            label: 'Out of Stock',
            value: analytics.stats.outOfStock,
            sub: 'Items unavailable for issuing',
            icon: '⛔',
            color: 'text-slate-700',
            bg: 'bg-slate-50',
        },
        {
            label: 'Total Value',
            value: analytics.stats.totalValue,
            sub: 'Calculated from item amounts',
            icon: '₱',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Top Stock Item',
            value: analytics.stats.highestConsumable,
            sub: 'Highest on-hand quantity',
            icon: '🏆',
            color: 'text-red-700',
            bg: 'bg-red-50',
        },
    ];

    const statusBars = [
        { label: 'Available', value: analytics.statusCounts.Available, color: 'bg-emerald-500' },
        { label: 'Low Stock', value: analytics.statusCounts['Low Stock'], color: 'bg-amber-500' },
        { label: 'Out of Stock', value: analytics.statusCounts['Out of Stock'], color: 'bg-red-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/40 flex font-sans text-gray-900">
            <Head title="Inventory Performance Analytics" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-200/70 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="mb-2">
                            <Breadcrumbs items={[{ name: 'Inventory' }, { name: 'Manage Analytics' }]} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inventory Performance Analytics</h2>
                        <p className="text-sm text-gray-500">Live metrics from the items database.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Data source</p>
                            <p className="text-sm font-bold text-gray-800">Items table</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <section className="rounded-[2rem] bg-gradient-to-br from-red-950 via-red-900 to-red-800 text-white shadow-xl overflow-hidden border border-red-900/50 relative">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(250,204,21,0.14),_transparent_28%)]" />
                            <div className="relative p-8 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-200/90 mb-3">Inventory snapshot</p>
                                    <h3 className="text-3xl md:text-4xl font-bold font-serif tracking-tight">Inventory Performance Analytics</h3>
                                    <p className="mt-3 text-red-100/90 text-base md:text-lg leading-relaxed">
                                        The page now reflects the current inventory records, including stock totals, item value, and alert counts.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                                    {statusBars.map((status) => (
                                        <div key={status.label} className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 min-w-[140px]">
                                            <p className="text-xs uppercase tracking-widest text-red-100/80 font-semibold">{status.label}</p>
                                            <div className="mt-2 flex items-end justify-between gap-3">
                                                <span className="text-2xl font-bold text-white">{status.value}</span>
                                                <span className={`h-2.5 flex-1 rounded-full ${status.color}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-end justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Overview</h3>
                                    <p className="mt-1 text-sm text-gray-500">Key performance indicators pulled from the items table.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {overviewCards.map((stat) => (
                                    <div key={stat.label} className="group overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} text-xl ring-1 ring-gray-900/5 group-hover:scale-105 transition-transform`}>
                                                {stat.icon}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 truncate">{stat.value}</p>
                                        <p className="mt-2 text-xs font-medium text-gray-400">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 space-y-6">
                                <BarChartCard
                                    title="Stock by Item"
                                    subtitle="Ranked by current stock levels from the items table."
                                    items={chartData.stockItems}
                                    formatValue={(value) => value.toLocaleString('en-PH')}
                                />

                                <BarChartCard
                                    title="Inventory Value by Item"
                                    subtitle="Highest item values based on stored amount."
                                    items={chartData.valueItems}
                                    formatValue={formatCurrency}
                                />
                            </div>

                            <div className="space-y-6">
                                <StatusDonutChart
                                    title="Status Breakdown"
                                    subtitle="Current inventory status distribution."
                                    series={chartData.statusSeries}
                                />

                                <BarChartCard
                                    title="Low Stock Watchlist"
                                    subtitle="Items below the safety threshold."
                                    items={chartData.lowStockItems}
                                    formatValue={(value) => `${value.toLocaleString('en-PH')} units`}
                                />
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">Inventory notes</h4>
                                    <p className="text-sm text-gray-500 mt-1">These chart cards are driven directly from the database records.</p>
                                </div>
                                <div className="text-sm font-semibold text-gray-500">
                                    Total inventory value: <span className="text-gray-900">{analytics.stats.totalValue}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {statusBars.map((status) => (
                                    <div key={status.label} className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{status.label}</p>
                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <span className="text-3xl font-bold text-gray-900">{status.value}</span>
                                            <span className={`h-3 flex-1 rounded-full ${status.color}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                    <h5 className="text-sm font-bold uppercase tracking-wider text-gray-600">Highest Consumables</h5>
                                    <p className="text-xs text-gray-500 mt-1">Top 5 items with the highest stock.</p>
                                    <div className="mt-4 space-y-3">
                                        {analytics.consumables.highest.length > 0 ? (
                                            analytics.consumables.highest.map((item, index) => (
                                                <div key={`high-${item.id}`} className="rounded-2xl bg-white border border-gray-100 p-3.5 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-red-700">#{index + 1}</p>
                                                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{item.sku}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 shrink-0">{item.stock.toLocaleString('en-PH')} {item.unitOfIssue}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                                                No highest consumable data available.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                                    <h5 className="text-sm font-bold uppercase tracking-wider text-gray-600">Lowest Consumables</h5>
                                    <p className="text-xs text-gray-500 mt-1">Top 5 items with the lowest stock.</p>
                                    <div className="mt-4 space-y-3">
                                        {analytics.consumables.lowest.length > 0 ? (
                                            analytics.consumables.lowest.map((item, index) => (
                                                <div key={`low-${item.id}`} className="rounded-2xl bg-white border border-gray-100 p-3.5 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-amber-700">#{index + 1}</p>
                                                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{item.sku}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 shrink-0">{item.stock.toLocaleString('en-PH')} {item.unitOfIssue}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                                                No lowest consumable data available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
