import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardCheck, PackageCheck, Rows3, Warehouse } from 'lucide-react';
import React, { useMemo } from 'react';
import type { CentralReceivingSummary as CentralReceivingSummaryType } from '../types';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type ReceivingSortKey = 'date' | 'item' | 'quantity' | 'recordedBy' | 'timestamp';

interface Props {
    summary: CentralReceivingSummaryType;
    canViewCatalog: boolean;
}

const metricCard = 'rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/40';

export default function CentralReceivingSummary({ summary, canViewCatalog }: Props) {
    const accessors = useMemo(() => ({
        date: (record: CentralReceivingSummaryType['recent_records'][number]) => record.date_received,
        item: (record: CentralReceivingSummaryType['recent_records'][number]) => record.item_name,
        quantity: (record: CentralReceivingSummaryType['recent_records'][number]) => record.quantity,
        recordedBy: (record: CentralReceivingSummaryType['recent_records'][number]) => record.recorded_by,
        timestamp: (record: CentralReceivingSummaryType['recent_records'][number]) => record.recorded_at,
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData<CentralReceivingSummaryType['recent_records'][number], ReceivingSortKey>(summary.recent_records, accessors, { key: 'date', direction: 'desc' });
    const metrics = [
        { label: 'Receiving records', value: summary.record_count, icon: Rows3 },
        { label: 'Supply types', value: summary.item_types, icon: Warehouse },
    ];

    return (
        <section aria-labelledby="central-receiving-heading" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700/70 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        <ClipboardCheck size={23} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h3 id="central-receiving-heading" className="text-base font-semibold">Central office receiving</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Supplies received and recorded by Inventory Staff during {summary.period_label}.
                        </p>
                    </div>
                </div>
                {canViewCatalog && (
                    <Link href={route('coordinator.catalog.index')} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-red-900 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-red-300 dark:hover:text-red-200">
                        View central catalog<ArrowRight size={14} aria-hidden="true" />
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 border-b border-slate-100 p-4 sm:grid-cols-3 dark:border-slate-800">
                <div className={metricCard}>
                    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <PackageCheck size={16} aria-hidden="true" />
                        Quantities received by unit
                    </p>
                    {summary.quantities_by_unit.length > 0 ? (
                        <ul aria-label="Quantities by unit" className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                            {summary.quantities_by_unit.map(({ unit, quantity }) => (
                                <li key={unit} className="text-slate-900 dark:text-slate-100">
                                    <span className="text-2xl font-semibold tabular-nums">{quantity.toLocaleString('en-PH')}</span>{' '}
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No quantities recorded</p>}
                </div>
                {metrics.map(metric => (
                    <div key={metric.label} className={metricCard}>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <metric.icon size={16} aria-hidden="true" />
                            <span>{metric.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{metric.value.toLocaleString('en-PH')}</p>
                    </div>
                ))}
            </div>

            {summary.recent_records.length > 0 ? (
                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="ui-data-table w-full min-w-[47.5rem] text-left text-sm">
                        <caption className="px-4 py-3 text-left text-sm text-slate-500 dark:text-slate-400">
                            Showing {summary.recent_records.length} of {summary.record_count} receiving records for {summary.period_label}, newest entries first.
                        </caption>
                        <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            <tr>
                                <SortableTableHeader column="date" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-medium align-middle">Date received</SortableTableHeader>
                                <SortableTableHeader column="item" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-medium align-middle">Supply / stock number</SortableTableHeader>
                                <SortableTableHeader column="quantity" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-medium align-middle">Quantity</SortableTableHeader>
                                <SortableTableHeader column="recordedBy" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-medium align-middle">Recorded by</SortableTableHeader>
                                <SortableTableHeader column="timestamp" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="whitespace-nowrap px-4 py-3.5 font-medium align-middle">Entry timestamp</SortableTableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedRows.map(record => (
                                <tr key={record.id}>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300 align-middle">
                                        <time dateTime={record.date_received || undefined}>{record.date_received_formatted || 'Not set'}</time>
                                    </td>
                                    <th scope="row" className="px-4 py-3.5 font-normal align-middle">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{record.item_name}</p>
                                        <p className="mt-1 text-slate-500 dark:text-slate-400">{record.stock_no}</p>
                                    </th>
                                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 align-middle">
                                        +{record.quantity.toLocaleString('en-PH')} {record.unit}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300 align-middle">{record.recorded_by}</td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500 dark:text-slate-400 align-middle">
                                        <time dateTime={record.recorded_at || undefined}>{record.recorded_at_formatted || 'Not available'}</time>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">No central receiving records for {summary.period_label}.</p>
            )}

            {summary.latest_recorded_at && (
                <p className="border-t border-slate-100 px-4 py-2 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Latest entry for this period recorded {summary.latest_recorded_at}.
                </p>
            )}
        </section>
    );
}
