import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    CalendarDays,
    ClipboardList,
    Download,
    Layers3,
    PackageCheck,
    RotateCcw,
    SlidersHorizontal,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import DashboardContent from '@/Layouts/DashboardContent';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { ManageAnalyticsPageProps, DepartmentUsage, SupplyTrend } from './types';
import InventoryOverview from './InventoryOverview';
import { ChartEmpty, DepartmentHeatmap, QuantityComparisonChart, SupplyTrendChart } from './Charts/SupplyDemandCharts';

const field =
    'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950';
const number = (value: number) => value.toLocaleString();
function Panel({
    title,
    description,
    controls,
    children,
    id,
}: {
    title: string;
    description?: string;
    controls?: React.ReactNode;
    children: React.ReactNode;
    id?: string;
}) {
    return (
        <section
            id={id}
            className="min-w-0 scroll-mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
                <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                    {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                </div>
                {controls}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}
function Ranking({
    rows,
    metric,
    color = '#991b1b',
}: {
    rows: { name: string; frequency?: number; requested?: number; issued?: number; requisitions?: number }[];
    metric: string;
    color?: string;
}) {
    if (!rows.length) return <ChartEmpty />;
    return (
        <div role="img" aria-label={rows.map((row) => `${row.name}: ${row[metric as keyof typeof row]}`).join('; ')}>
            <ChartContainer
                config={{
                    [metric]: {
                        label:
                            metric === 'frequency'
                                ? 'Requisition frequency'
                                : metric === 'requested'
                                  ? 'Quantity requested'
                                  : metric === 'issued'
                                    ? 'Supplies issued'
                                    : 'Requisitions',
                        color,
                    },
                }}
                className="w-full aspect-auto"
                style={{ height: Math.max(220, rows.length * 45) }}
            >
                <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 30 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(name) => (name.length > 25 ? `${name.slice(0, 24)}…` : name)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                        dataKey={metric}
                        name={
                            metric === 'frequency'
                                ? 'Requisition frequency'
                                : metric === 'requested'
                                  ? 'Quantity requested'
                                  : metric === 'issued'
                                    ? 'Supplies issued'
                                    : 'Requisitions'
                        }
                        fill={color}
                        radius={[0, 4, 4, 0]}
                    />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
type Column = { key: string; label: string; render?: (value: any, row: any, index: number) => React.ReactNode };
function DataTable({
    rows,
    columns,
    searchLabel,
    initialSort = 'requested',
    initialAscending = false,
}: {
    rows: any[];
    columns: Column[];
    searchLabel: string;
    initialSort?: string;
    initialAscending?: boolean;
}) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState(initialSort);
    const [ascending, setAscending] = useState(initialAscending);
    const [page, setPage] = useState(0);
    useEffect(() => setPage(0), [rows, search]);
    const filtered = rows
        .filter((row) =>
            Object.values(row).some((value) =>
                String(value ?? '')
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) => {
            const comparison =
                typeof a[sort] === 'number'
                    ? a[sort] - b[sort]
                    : String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''));
            return ascending ? comparison : -comparison;
        });
    const exportCsv = () => {
        const cell = (value: unknown) =>
            `"${String(value ?? '')
                .replace(/"/g, '""')
                .replace(/^[=+@-]/, "'$&")}"`;
        const csv = [
            columns.map((c) => cell(c.label)).join(','),
            ...filtered.map((row) => columns.map((c) => cell(row[c.key])).join(',')),
        ].join('\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'consumable-supply-analytics.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    };
    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <input
                    type="search"
                    aria-label={searchLabel}
                    placeholder={searchLabel}
                    className={`${field} sm:max-w-sm`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-300"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="whitespace-nowrap p-3"
                                    aria-sort={sort === column.key ? (ascending ? 'ascending' : 'descending') : 'none'}
                                >
                                    <button
                                        className="text-left"
                                        onClick={() => {
                                            setSort(column.key);
                                            setAscending(sort === column.key ? !ascending : true);
                                        }}
                                    >
                                        {column.label} {sort === column.key ? (ascending ? '↑' : '↓') : '↕'}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.slice(page * 10, page * 10 + 10).map((row, index) => (
                            <tr key={row.id ?? row.name} className="border-b border-slate-100 dark:border-slate-800">
                                {columns.map((column) => (
                                    <td key={column.key} className="p-3">
                                        {column.render
                                            ? column.render(row[column.key], row, page * 10 + index)
                                            : typeof row[column.key] === 'number'
                                              ? number(row[column.key])
                                              : (row[column.key] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {!filtered.length && (
                            <tr>
                                <td colSpan={columns.length} className="p-10 text-center text-slate-500">
                                    No matching records for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>{filtered.length} records</span>
                <div className="flex items-center gap-3">
                    <button disabled={page === 0} onClick={() => setPage(page - 1)} className="disabled:opacity-40">
                        Previous
                    </button>
                    <span>
                        Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / 10))}
                    </span>
                    <button
                        disabled={(page + 1) * 10 >= filtered.length}
                        onClick={() => setPage(page + 1)}
                        className="disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
const itemColumns: Column[] = [
    { key: 'name', label: 'Consumable item' },
    { key: 'frequency', label: 'Requisitions containing item' },
    { key: 'requested', label: 'Quantity requested' },
    { key: 'issued', label: 'Supplies issued' },
    { key: 'latest', label: 'Latest requisition', render: (value) => (value ? String(value).slice(0, 10) : '—') },
];

export default function AnalyticsIndex({ auth, analytics, supplyAnalytics: data }: ManageAnalyticsPageProps) {
    const [filters, setFilters] = useState(data.filters);
    const [loading, setLoading] = useState(false);
    const [filterError, setFilterError] = useState('');
    const [departmentMetric, setDepartmentMetric] = useState('requested');
    const [itemMetric, setItemMetric] = useState('frequency');
    const [includeZero, setIncludeZero] = useState(false);
    const [department, setDepartment] = useState(
        String(
            data.filters.department ||
                data.departments.find((d) => d.requisitions > 0)?.name ||
                data.options.departments[0] ||
                '',
        ),
    );
    const [yearly, setYearly] = useState(false);
    useEffect(() => setFilters(data.filters), [data.filters]);
    useEffect(() => {
        if (data.filters.department) setDepartment(String(data.filters.department));
    }, [data.filters.department]);
    const update = (key: string, value: string) => {
        const next = { ...filters, [key]: value };
        if (key === 'month' && !next.year) next.year = String(filters.start_date).slice(0, 4);
        if (key === 'year' || key === 'month') {
            delete next.start_date;
            delete next.end_date;
        }
        setFilterError('');
        setFilters(next);
        router.get(route('compliance.analytics'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
            onError: (errors) => setFilterError(Object.values(errors).join(' ')),
        });
    };
    const departmentRows = data.departments.filter((d) => includeZero || d.requisitions > 0 || d.issued > 0);
    const ranked = [...departmentRows].sort(
        (a, b) =>
            Number(b[departmentMetric as keyof DepartmentUsage]) -
                Number(a[departmentMetric as keyof DepartmentUsage]) || a.name.localeCompare(b.name),
    );
    const lowest = [...departmentRows].sort(
        (a, b) =>
            Number(a[departmentMetric as keyof DepartmentUsage]) -
                Number(b[departmentMetric as keyof DepartmentUsage]) || a.name.localeCompare(b.name),
    );
    const activeValues = data.departments
        .filter((row) => row.requisitions > 0 || row.issued > 0)
        .map((row) => Number(row[departmentMetric as keyof DepartmentUsage]));
    const maxActivity = Math.max(0, ...activeValues);
    const minActivity = Math.min(...activeValues);
    const demand = data.demand.filter((row) => row.department === department);
    const requested = [...demand]
        .filter((row) => row.frequency > 0)
        .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name));
    const trendRows = (rows: SupplyTrend[]) =>
        yearly
            ? Object.values(
                  rows.reduce<Record<string, SupplyTrend>>((result, row) => {
                      const year = row.month.slice(0, 4);
                      const target = (result[year] ??= {
                          month: year,
                          requisitions: 0,
                          requested: 0,
                          issued: 0,
                          topItem: '—',
                      });
                      target.requisitions += row.requisitions;
                      target.requested += row.requested;
                      target.issued += row.issued;
                      return result;
                  }, {}),
              )
            : rows;
    const kpis = [
        {
            label: 'Total Requisitions',
            value: data.stats.totalRequisitions,
            icon: ClipboardList,
            detail: 'Unique submitted requests',
            previous: data.comparison.stats.totalRequisitions,
        },
        {
            label: 'Most Requested Item',
            value: data.stats.mostRequestedItem,
            icon: Layers3,
            detail: 'Ranked by requisition frequency',
        },
        {
            label: 'Highest Requesting Department',
            value: data.stats.highestDepartment,
            icon: ArrowUpRight,
            detail: 'Highest quantity among active offices',
        },
        {
            label: 'Lowest Requesting Department',
            value: data.stats.lowestDepartment,
            icon: ArrowDownLeft,
            detail: 'Lowest quantity among active offices',
        },
        {
            label: 'Total Supplies Issued',
            value: data.stats.totalIssued,
            icon: PackageCheck,
            detail: 'Confirmed official releases',
            previous: data.comparison.stats.totalIssued,
        },
        {
            label: 'Active Requesting Offices',
            value: data.stats.activeOffices,
            icon: Building2,
            detail: 'Offices with submitted requisitions',
            previous: data.comparison.stats.activeOffices,
        },
    ];
    const filterCount = ['department', 'category', 'item_id', 'status'].filter((key) => data.filters[key]).length;
    return (
        <>
            <Head title="Consumable Supply Analytics" />
            <DashboardLayout modules={getSidebarModules('Compliance', 'Consumable Supply Analytics')} user={auth.user}>
                <PageHeader
                    title="Consumable Supply Analytics"
                    description="Monitor departmental supply demand, requisition patterns, and consumable supply issuance."
                    breadcrumbs={[{ name: 'Compliance' }, { name: 'Consumable Supply Analytics' }]}
                />
                <DashboardContent>
                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-red-100 bg-gradient-to-r from-red-50/80 to-white px-5 py-4 sm:flex-row sm:items-center dark:border-red-900/40 dark:from-red-950/30 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-red-900 p-2.5 text-white">
                                <Activity size={21} aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-red-950 dark:text-red-200">
                                    University supply intelligence
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Demand, distribution, and office activity in one view
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-2 self-start rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            <CalendarDays size={15} aria-hidden="true" />
                            {data.filters.start_date} — {data.filters.end_date}
                        </span>
                    </div>
                    <Panel
                        id="analytics-filters"
                        title="Analytics filters"
                        description={`${data.filters.start_date} to ${data.filters.end_date}`}
                        controls={
                            <div className="flex items-center gap-4">
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <SlidersHorizontal size={14} />
                                    {filterCount ? `${filterCount} active filters` : 'All offices & items'}
                                </span>
                                <button
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-300"
                                    onClick={() =>
                                        router.get(route('compliance.analytics'), {}, { preserveScroll: true })
                                    }
                                >
                                    <RotateCcw size={15} />
                                    Reset Filters
                                </button>
                            </div>
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {['start_date', 'end_date'].map((key) => (
                                <label key={key} className="text-sm text-slate-600 dark:text-slate-300">
                                    {key === 'start_date' ? 'Start date' : 'End date'}
                                    <input
                                        type="date"
                                        className={`${field} mt-1.5`}
                                        value={filters[key] || ''}
                                        onChange={(e) => update(key, e.target.value)}
                                    />
                                </label>
                            ))}
                            <label className="text-sm text-slate-600 dark:text-slate-300">
                                Year
                                <input
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    className={`${field} mt-1.5`}
                                    value={filters.year || String(data.filters.start_date).slice(0, 4)}
                                    onChange={(e) => {
                                        setFilters({ ...filters, year: e.target.value });
                                    }}
                                    onBlur={(e) => {
                                        if (Number(e.target.value) >= 2000 && Number(e.target.value) <= 2100)
                                            update('year', e.target.value);
                                    }}
                                />
                            </label>
                            {[
                                {
                                    key: 'month',
                                    label: 'Month',
                                    options: Array.from({ length: 12 }, (_, index) => ({
                                        value: String(index + 1),
                                        label: new Date(2000, index).toLocaleString('en', { month: 'long' }),
                                    })),
                                },
                                {
                                    key: 'department',
                                    label: 'Department or office',
                                    options: data.options.departments.map((name) => ({ value: name, label: name })),
                                },
                                {
                                    key: 'category',
                                    label: 'Item category (supplier classification)',
                                    options: data.options.categories.map((name) => ({ value: name, label: name })),
                                },
                                {
                                    key: 'item_id',
                                    label: 'Consumable item',
                                    options: data.options.items.map((item) => ({
                                        value: String(item.id),
                                        label: item.name,
                                    })),
                                },
                                {
                                    key: 'status',
                                    label: 'Requisition status',
                                    options: [
                                        'Pending',
                                        'Approved',
                                        'Rejected',
                                        'Ready for Pickup',
                                        'Released',
                                        'Issued',
                                    ].map((name) => ({ value: name, label: name })),
                                },
                            ].map(({ key, label, options }) => (
                                <label key={key} className="text-sm text-slate-600 dark:text-slate-300">
                                    {label}
                                    <select
                                        className={`${field} mt-1.5`}
                                        value={filters[key] || ''}
                                        onChange={(e) => update(key, e.target.value)}
                                    >
                                        <option value="">All</option>
                                        {options.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </div>
                        {filterError && (
                            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                                {filterError}
                            </p>
                        )}
                        <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-500">
                            {loading
                                ? 'Updating analytics…'
                                : 'All demand and issuance sections use these filters. Year and month reset the date range.'}
                        </p>
                    </Panel>
                    <nav aria-label="Analytics sections" className="flex gap-2 overflow-x-auto pb-1">
                        {[
                            ['office-rankings', 'Office rankings'],
                            ['item-rankings', 'Requested items'],
                            ['department-demand', 'Department demand'],
                            ['supply-trends', 'Trends'],
                            ['demand-heatmap', 'Demand heatmap'],
                            ['department-usage', 'Detailed usage'],
                        ].map(([id, label]) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                    <div aria-busy={loading} className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
                        <section aria-label="Analytics summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {kpis.map(({ label, value, icon: Icon, detail, previous }) => (
                                <div
                                    key={label}
                                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                                        <span
                                            className={`shrink-0 rounded-lg p-2 ${label === 'Total Supplies Issued' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-300'}`}
                                        >
                                            <Icon size={17} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <p
                                        className={`mt-2 font-bold text-slate-900 dark:text-slate-100 ${typeof value === 'number' ? 'text-3xl tabular-nums' : 'text-lg'}`}
                                    >
                                        {typeof value === 'number' ? number(value) : value}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                                    {previous !== undefined && typeof value === 'number' && (
                                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                            <span className="rounded-md bg-slate-100 px-1.5 py-1 font-medium tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {value - previous > 0 ? '+' : ''}
                                                {number(value - previous)}
                                            </span>
                                            <span>vs. previous period</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>
                        <p className="rounded-xl border border-red-100 bg-red-50/60 p-4 text-sm leading-relaxed text-red-950 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                            Supplies Issued measures confirmed releases, not end-user consumption. Demand uses
                            submission dates; issuance uses official release dates, including releases for earlier
                            requests. Frequency counts unique requisitions per item. Quantities may span different
                            units. Lowest-demand summary considers active offices.
                        </p>
                        <Panel
                            id="office-rankings"
                            title="Highest and Lowest Requesting Departments/Offices"
                            description="Compare institutional demand and confirmed supply distribution."
                            controls={
                                <select
                                    aria-label="Department ranking metric"
                                    className={field}
                                    value={departmentMetric}
                                    onChange={(e) => setDepartmentMetric(e.target.value)}
                                >
                                    <option value="requested">Total quantity requested</option>
                                    <option value="requisitions">Number of requisitions</option>
                                    <option value="issued">Total quantity issued</option>
                                </select>
                            }
                        >
                            <label className="mb-5 flex items-center gap-2 text-sm text-slate-500">
                                <input
                                    type="checkbox"
                                    checked={includeZero}
                                    onChange={(e) => setIncludeZero(e.target.checked)}
                                />
                                Include zero-activity offices in rankings
                            </label>
                            <div className="grid gap-8 xl:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold">
                                        Top 5 Highest Requesting Departments/Offices
                                    </h3>
                                    <Ranking rows={ranked.slice(0, 5)} metric={departmentMetric} />
                                </div>
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold">
                                        Top 5 Lowest Requesting Departments/Offices
                                    </h3>
                                    <Ranking rows={lowest.slice(0, 5)} metric={departmentMetric} color="#0f766e" />
                                </div>
                            </div>
                        </Panel>
                        <Panel
                            id="item-rankings"
                            title="Most Frequently Requested Items"
                            description="Frequency and quantity are calculated separately."
                            controls={
                                <select
                                    className={field}
                                    aria-label="Item ranking metric"
                                    value={itemMetric}
                                    onChange={(e) => setItemMetric(e.target.value)}
                                >
                                    <option value="frequency">Request frequency</option>
                                    <option value="requested">Total requested quantity</option>
                                </select>
                            }
                        >
                            <h3 className="mb-3 text-sm font-semibold">Top 10 Most Requested Items</h3>
                            <Ranking
                                rows={[...data.items]
                                    .filter((item) => item.frequency > 0)
                                    .sort(
                                        (a, b) =>
                                            Number(b[itemMetric as 'frequency' | 'requested']) -
                                                Number(a[itemMetric as 'frequency' | 'requested']) ||
                                            a.name.localeCompare(b.name),
                                    )
                                    .slice(0, 10)}
                                metric={itemMetric}
                            />
                            <DataTable
                                rows={data.items}
                                columns={[
                                    itemColumns[0],
                                    { key: 'category', label: 'Category (supplier)' },
                                    ...itemColumns.slice(1),
                                    { key: 'offices', label: 'Requesting offices' },
                                ]}
                                searchLabel="Search requested items"
                                initialSort="frequency"
                            />
                        </Panel>
                        <Panel
                            id="department-demand"
                            title="Departmental Item Demand Analysis"
                            description="Select an office to explore its requests within the current filters."
                            controls={
                                <select
                                    aria-label="Department for item demand"
                                    className={field}
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                >
                                    {data.options.departments
                                        .filter((name) => !data.filters.department || name === data.filters.department)
                                        .map((name) => (
                                            <option key={name}>{name}</option>
                                        ))}
                                </select>
                            }
                        >
                            <div className="mb-5 grid gap-4 sm:grid-cols-2">
                                <p className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
                                    Most frequent: <strong>{requested[0]?.name || '—'}</strong>
                                </p>
                                <p className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
                                    Least frequent:{' '}
                                    <strong>
                                        {[...requested].sort(
                                            (a, b) => a.frequency - b.frequency || a.name.localeCompare(b.name),
                                        )[0]?.name || '—'}
                                    </strong>
                                </p>
                            </div>
                            <QuantityComparisonChart rows={demand} />
                            <DataTable
                                rows={demand}
                                columns={itemColumns}
                                searchLabel="Search departmental items"
                                initialSort="frequency"
                            />
                            <h3 className="my-4 text-sm font-semibold">Monthly departmental requisition history</h3>
                            <SupplyTrendChart
                                rows={data.departmentTrends.filter((row) => row.department === department)}
                            />
                            <details className="mt-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                                <summary className="cursor-pointer text-sm font-semibold">
                                    Historical item demand by month
                                </summary>
                                <div className="mt-4">
                                    <DataTable
                                        rows={data.demandHistory.filter((row) => row.department === department)}
                                        columns={[{ key: 'month', label: 'Month' }, ...itemColumns.slice(0, 4)]}
                                        searchLabel="Search item demand history"
                                        initialSort="month"
                                    />
                                </div>
                            </details>
                        </Panel>
                        <Panel
                            id="supply-trends"
                            title="Supply Requisition Trends"
                            description={`Previous equal-length period: ${data.comparison.start} to ${data.comparison.end}. All non-date filters are shared.`}
                            controls={
                                <select
                                    aria-label="Trend interval"
                                    className={field}
                                    value={yearly ? 'year' : 'month'}
                                    onChange={(e) => setYearly(e.target.value === 'year')}
                                >
                                    <option value="month">Monthly</option>
                                    <option value="year">Yearly</option>
                                </select>
                            }
                        >
                            <div className="grid gap-6 xl:grid-cols-2">
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold">Selected reporting period</h3>
                                    <SupplyTrendChart rows={trendRows(data.trends)} />
                                </div>
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold">Previous reporting period</h3>
                                    <SupplyTrendChart rows={trendRows(data.comparison.trends)} />
                                </div>
                            </div>
                            <DataTable
                                rows={data.trends.map((row) => ({ ...row, name: row.month }))}
                                columns={[
                                    { key: 'month', label: 'Month' },
                                    { key: 'requisitions', label: 'Requisitions' },
                                    { key: 'requested', label: 'Quantity requested' },
                                    { key: 'issued', label: 'Supplies issued' },
                                    { key: 'topItem', label: 'Most frequent item' },
                                ]}
                                searchLabel="Search monthly history"
                                initialSort="month"
                            />
                        </Panel>
                        <Panel
                            id="demand-heatmap"
                            title="Departmental Demand Heatmap"
                            description="Explore office activity month by month. Darker cells indicate higher values within the selected metric."
                        >
                            <DepartmentHeatmap rows={data.departmentTrends} />
                        </Panel>
                        <Panel
                            id="department-usage"
                            title="Department and Office Supply Usage"
                            description="Complete directory, including zero-activity offices. Demand change compares requested quantities with the previous period."
                        >
                            <DataTable
                                key={departmentMetric}
                                initialSort="rank"
                                initialAscending
                                rows={[...data.departments]
                                    .sort(
                                        (a, b) =>
                                            Number(b[departmentMetric as keyof DepartmentUsage]) -
                                                Number(a[departmentMetric as keyof DepartmentUsage]) ||
                                            a.name.localeCompare(b.name),
                                    )
                                    .map((row, index) => ({
                                        ...row,
                                        rank: index + 1,
                                        activity:
                                            row.requisitions === 0 && row.issued === 0
                                                ? 'No activity'
                                                : Number(row[departmentMetric as keyof DepartmentUsage]) === maxActivity
                                                  ? 'Highest'
                                                  : Number(row[departmentMetric as keyof DepartmentUsage]) ===
                                                      minActivity
                                                    ? 'Low'
                                                    : 'Active',
                                    }))}
                                columns={[
                                    { key: 'rank', label: `Rank (${departmentMetric})` },
                                    { key: 'name', label: 'Department / office' },
                                    {
                                        key: 'activity',
                                        label: 'Activity',
                                        render: (value) => (
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${value === 'Highest' ? 'bg-red-100 text-red-900' : value === 'Low' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {value}
                                            </span>
                                        ),
                                    },
                                    { key: 'requisitions', label: 'Requisitions' },
                                    { key: 'requested', label: 'Quantity requested' },
                                    { key: 'issued', label: 'Supplies issued' },
                                    { key: 'topItem', label: 'Most frequent item' },
                                    { key: 'distinctItems', label: 'Distinct items' },
                                    { key: 'previousRequested', label: 'Previous requested' },
                                    {
                                        key: 'demandChange',
                                        label: 'Demand change',
                                        render: (value) => (
                                            <span>
                                                {value > 0 ? '↑ +' : value < 0 ? '↓ ' : ''}
                                                {number(value)}
                                            </span>
                                        ),
                                    },
                                ]}
                                searchLabel="Search departments and offices"
                            />
                        </Panel>
                    </div>
                    {analytics && <InventoryOverview analytics={analytics} />}
                </DashboardContent>
            </DashboardLayout>
        </>
    );
}
