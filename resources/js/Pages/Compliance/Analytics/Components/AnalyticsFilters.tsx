import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import {
    Building2,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    ListFilter,
    LoaderCircle,
    RotateCcw,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { SupplyAnalytics } from '../types';

type Option = { value: string; label: string };
export function AnalyticsSelect({
    id,
    label,
    value,
    options,
    onChange,
    placeholder = 'All',
    clearable = false,
    disabled = false,
}: {
    id: string;
    label: string;
    value: string | number;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
}) {
    return (
        <Select<Option, false>
            inputId={id}
            instanceId={id}
            aria-label={label}
            options={options}
            value={options.find((option) => option.value === String(value)) ?? null}
            onChange={(option) => onChange(option?.value ?? '')}
            placeholder={placeholder}
            isClearable={clearable}
            isDisabled={disabled}
            styles={{
                ...institutionalSelectStyles,
                menuPortal: (base) => ({ ...base, zIndex: 80 }),
                input: (base, state) => ({
                    ...institutionalSelectStyles.input?.(base, state),
                    input: { minHeight: 0 },
                }),
                placeholder: (base, state) => ({
                    ...institutionalSelectStyles.placeholder?.(base, state),
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }),
            }}
            classNamePrefix="react-select"
            menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
            menuPosition="fixed"
        />
    );
}

export default function AnalyticsFilters({
    filters,
    options,
    loading,
    error,
    onChange,
    onPeriod,
    onReset,
}: {
    filters: SupplyAnalytics['filters'];
    options: SupplyAnalytics['options'];
    loading: boolean;
    error: string;
    onChange: (key: string, value: string) => void;
    onPeriod: (year: string, month: string) => void;
    onReset: () => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const [year, setYear] = useState(String(filters.year || String(filters.start_date).slice(0, 4)));
    useEffect(
        () => setYear(String(filters.year || String(filters.start_date).slice(0, 4))),
        [filters.year, filters.start_date],
    );
    const monthOptions = Array.from({ length: 12 }, (_, index) => ({
        value: String(index + 1),
        label: new Date(2000, index).toLocaleString('en', { month: 'long' }),
    }));
    const scope = [
        {
            key: 'department',
            label: 'Department or office',
            placeholder: 'All departments & offices',
            options: options.departments.map((name) => ({ value: name, label: name })),
        },
        {
            key: 'category',
            label: 'Category (supplier classification)',
            placeholder: 'All categories',
            options: options.categories.map((name) => ({ value: name, label: name })),
        },
        {
            key: 'item_id',
            label: 'Consumable item',
            placeholder: 'All consumable items',
            options: options.items.map((item) => ({ value: String(item.id), label: item.name })),
        },
        {
            key: 'status',
            label: 'Requisition status',
            placeholder: 'All statuses',
            options: ['Pending', 'Approved', 'Rejected', 'Ready for Pickup', 'Released', 'Issued'].map((name) => ({
                value: name,
                label: name,
            })),
        },
    ];
    const active = scope.filter((field) => filters[field.key]);
    const dateClass =
        'h-10 w-full min-w-0 rounded-lg border border-[var(--border-color)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-sm focus:border-red-900 focus:ring-red-900';
    return (
        <section
            id="analytics-filters"
            aria-label="Global analytics filters"
            className="relative rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-700/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <span className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                        <SlidersHorizontal size={18} />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Analytics filters</h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            One reporting scope for every chart and table
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {active.length ? `${active.length} active filters` : 'University-wide'}
                    </span>
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-900 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/50"
                    >
                        <RotateCcw size={14} />
                        Reset filters
                    </button>
                </div>
            </div>
            <div className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <CalendarDays size={14} />
                        Reporting period
                    </h3>
                    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                        {[
                            {
                                label: 'This month',
                                year: String(new Date().getFullYear()),
                                month: String(new Date().getMonth() + 1),
                            },
                            { label: 'This year', year: String(new Date().getFullYear()), month: '' },
                            { label: 'Last year', year: String(new Date().getFullYear() - 1), month: '' },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                disabled={loading}
                                onClick={() => onPeriod(preset.year, preset.month)}
                                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-red-900 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-red-200"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {['start_date', 'end_date'].map((key) => (
                        <label
                            key={key}
                            htmlFor={`analytics-${key}`}
                            className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                        >
                            <span className="block">{key === 'start_date' ? 'From date' : 'To date'}</span>
                            <input
                                id={`analytics-${key}`}
                                type="date"
                                value={filters[key] || ''}
                                onChange={(e) => onChange(key, e.target.value)}
                                className={dateClass}
                                disabled={loading}
                            />
                        </label>
                    ))}
                    <label
                        htmlFor="analytics-year"
                        className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                        <span className="block">Year</span>
                        <input
                            id="analytics-year"
                            type="number"
                            min={2000}
                            max={2100}
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            onBlur={() => {
                                if (
                                    Number(year) >= 2000 &&
                                    Number(year) <= 2100 &&
                                    year !== String(filters.year || String(filters.start_date).slice(0, 4))
                                )
                                    onChange('year', year);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            className={dateClass}
                            disabled={loading}
                        />
                    </label>
                    <div className="space-y-2">
                        <label
                            htmlFor="analytics-month"
                            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                        >
                            Month
                        </label>
                        <AnalyticsSelect
                            id="analytics-month"
                            label="Reporting month"
                            value={filters.month || ''}
                            options={monthOptions}
                            placeholder="All months"
                            clearable
                            onChange={(value) => onChange('month', value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        aria-expanded={expanded}
                        aria-controls="analytics-record-scope"
                        className="flex w-full items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                        <span className="flex items-center gap-2">
                            <ListFilter size={14} />
                            Refine records
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] normal-case tracking-normal dark:bg-slate-800">
                                Optional
                            </span>
                        </span>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div
                        id="analytics-record-scope"
                        hidden={!expanded}
                        className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {scope.map((field) => (
                            <div key={field.key} className="space-y-2">
                                <label
                                    htmlFor={`analytics-${field.key}`}
                                    className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                                >
                                    {field.label}
                                </label>
                                <AnalyticsSelect
                                    id={`analytics-${field.key}`}
                                    label={field.label}
                                    value={filters[field.key] || ''}
                                    options={field.options}
                                    placeholder={field.placeholder}
                                    clearable
                                    disabled={loading}
                                    onChange={(value) => onChange(field.key, value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {active.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {active.map((field) => (
                            <button
                                key={field.key}
                                type="button"
                                disabled={loading}
                                onClick={() => onChange(field.key, '')}
                                className="inline-flex max-w-full items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
                                aria-label={`Remove ${field.label} filter`}
                            >
                                <span className="truncate">
                                    {field.options.find((option) => option.value === String(filters[field.key]))
                                        ?.label || filters[field.key]}
                                </span>
                                <X size={12} className="shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
                {error && (
                    <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </p>
                )}
            </div>
            <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400"
            >
                {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Building2 size={14} />}
                <span>
                    {loading
                        ? 'Updating charts and tables…'
                        : 'Filters apply automatically. Year and month selections reset the date range.'}
                </span>
            </div>
        </section>
    );
}
