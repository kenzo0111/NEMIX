import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/Components/ui/chart';
import { Activity, Search } from 'lucide-react';
import { ItemDemand, SupplyTrend } from '../types';

const config = {
    requested: { label: 'Quantity requested', theme: { light: '#991b1b', dark: '#f87171' } },
    issued: { label: 'Supplies issued', theme: { light: '#0f766e', dark: '#2dd4bf' } },
    requisitions: { label: 'Requisitions', theme: { light: '#64748b', dark: '#94a3b8' } },
} satisfies ChartConfig;
const axis = { fontSize: 11, fill: 'var(--chart-tick-muted)' };
const shortName = (name: string) => (name.length > 26 ? `${name.slice(0, 25)}…` : name);

export function ChartEmpty({ message = 'No matching activity in this period.' }: { message?: string }) {
    return (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-950/40">
            <Activity className="text-slate-400" size={26} aria-hidden="true" />
            <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{message}</p>
        </div>
    );
}

export function QuantityComparisonChart({ rows }: { rows: ItemDemand[] }) {
    if (!rows.length)
        return <ChartEmpty message="Select an office with item activity to compare requests and confirmed releases." />;
    const chartRows = [...rows].sort((a, b) => b.requested - a.requested || a.name.localeCompare(b.name)).slice(0, 10);
    return (
        <div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Top 10 items by requested quantity · quantities use each item's recorded unit
            </p>
            <ChartContainer
                config={config}
                className="w-full aspect-auto"
                style={{ height: Math.max(250, chartRows.length * 58) }}
            >
                <BarChart data={chartRows} layout="vertical" accessibilityLayer margin={{ left: 0, right: 12 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={145}
                        tickFormatter={shortName}
                        tick={axis}
                        axisLine={false}
                        tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                        dataKey="requested"
                        name="Quantity requested"
                        fill="var(--color-requested)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={14}
                    />
                    <Bar
                        dataKey="issued"
                        name="Supplies issued"
                        fill="var(--color-issued)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={14}
                    />
                </BarChart>
            </ChartContainer>
        </div>
    );
}

export function SupplyTrendChart({ rows }: { rows: SupplyTrend[] }) {
    if (!rows.some((row) => row.requested > 0 || row.issued > 0 || row.requisitions > 0)) return <ChartEmpty />;
    return (
        <div className="space-y-5">
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Requested and issued quantities
                </p>
                <ChartContainer config={config} className="h-64 w-full aspect-auto">
                    <LineChart data={rows} accessibilityLayer margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} minTickGap={20} />
                        <YAxis tick={axis} allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            type="linear"
                            dataKey="requested"
                            name="Quantity requested"
                            stroke="var(--color-requested)"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="linear"
                            dataKey="issued"
                            name="Supplies issued"
                            stroke="var(--color-issued)"
                            strokeWidth={2.5}
                            strokeDasharray="5 3"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ChartContainer>
            </div>
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Submitted requisitions · separate count scale
                </p>
                <ChartContainer config={config} className="h-36 w-full aspect-auto">
                    <BarChart data={rows} accessibilityLayer margin={{ top: 5, right: 12, bottom: 0, left: -12 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} minTickGap={20} />
                        <YAxis tick={axis} allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="requisitions"
                            name="Requisitions"
                            fill="var(--color-requisitions)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={24}
                        />
                    </BarChart>
                </ChartContainer>
            </div>
        </div>
    );
}

const levels = [
    'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
    'bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-200',
    'bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-100',
    'bg-red-400 text-red-950 dark:bg-red-700 dark:text-white',
    'bg-red-800 text-white dark:bg-red-500 dark:text-white',
];
type HeatMetric = 'requested' | 'issued' | 'requisitions';
export function DepartmentHeatmap({ rows }: { rows: (SupplyTrend & { department: string })[] }) {
    const [metric, setMetric] = useState<HeatMetric>('requested');
    const [search, setSearch] = useState('');
    const [showAll, setShowAll] = useState(false);
    const months = [...new Set(rows.map((row) => row.month))].sort();
    const departments = [...new Set(rows.map((row) => row.department))];
    const totals = new Map<string, number>();
    const cells = new Map<string, number>();
    for (const row of rows) {
        totals.set(row.department, (totals.get(row.department) ?? 0) + row[metric]);
        cells.set(`${row.department}|${row.month}`, row[metric]);
    }
    const matches = departments
        .filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0) || a.localeCompare(b));
    const visible = showAll ? matches : matches.slice(0, 10);
    const max = Math.max(0, ...rows.map((row) => row[metric]));
    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1 sm:max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
                    <input
                        type="search"
                        aria-label="Search offices in demand heatmap"
                        placeholder="Find an office…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="min-h-11 w-full rounded-lg border-slate-300 bg-white pl-9 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950"
                    />
                </div>
                <select
                    aria-label="Heatmap metric"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as HeatMetric)}
                    className="min-h-11 rounded-lg border-slate-300 bg-white text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950"
                >
                    <option value="requested">Quantity requested</option>
                    <option value="issued">Supplies issued</option>
                    <option value="requisitions">Requisition count</option>
                </select>
            </div>
            {!visible.length || !months.length ? (
                <ChartEmpty message="No offices match your search and reporting filters." />
            ) : (
                <div className="max-h-[480px] overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
                    <table className="w-full border-separate border-spacing-1 text-xs">
                        <caption className="sr-only">
                            Monthly department {metric}. Darker cells indicate higher values; zero indicates no recorded
                            activity.
                        </caption>
                        <thead>
                            <tr>
                                <th className="sticky left-0 top-0 z-20 min-w-44 bg-white p-2 text-left font-medium text-slate-500 dark:bg-slate-900">
                                    Department / office
                                </th>
                                {months.map((month) => (
                                    <th
                                        key={month}
                                        scope="col"
                                        className="sticky top-0 z-10 min-w-16 bg-white p-2 font-medium text-slate-500 dark:bg-slate-900"
                                    >
                                        {month}
                                    </th>
                                ))}
                                <th className="sticky top-0 bg-white p-2 text-slate-500 dark:bg-slate-900">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((name) => (
                                <tr key={name}>
                                    <th
                                        scope="row"
                                        className="sticky left-0 z-10 max-w-56 bg-white p-2 text-left font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        {name}
                                    </th>
                                    {months.map((month) => {
                                        const value = cells.get(`${name}|${month}`) ?? 0;
                                        const level = value === 0 ? 0 : Math.max(1, Math.ceil((value / max) * 4));
                                        return (
                                            <td
                                                key={month}
                                                title={`${name} · ${month}: ${value.toLocaleString()} ${config[metric].label}`}
                                                className={`rounded-md px-2 py-3 text-center tabular-nums ${levels[level]}`}
                                            >
                                                {value.toLocaleString()}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 text-center font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                        {(totals.get(name) ?? 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <span className="mr-1">No activity</span>
                    {levels.map((level, index) => (
                        <span key={level} className={`h-3 w-4 rounded-sm ${level}`} aria-hidden="true" />
                    ))}
                    <span className="ml-1">High activity</span>
                </div>
                <span>
                    {visible.length} of {matches.length} offices
                </span>
            </div>
            {matches.length > 10 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-4 text-sm font-semibold text-red-900 dark:text-red-300"
                >
                    {showAll ? 'Show top 10 offices' : 'Show all offices'}
                </button>
            )}
        </div>
    );
}
