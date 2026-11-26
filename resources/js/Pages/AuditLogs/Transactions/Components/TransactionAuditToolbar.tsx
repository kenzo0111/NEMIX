import { Button } from '@/Components/ui/button';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select, { SingleValue } from 'react-select';
import { Search, RotateCcw, Calendar as CalendarIcon, X, Layers, ListFilter } from 'lucide-react';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { TransactionAuditFilters } from '../types';

interface OptionType {
    value: string;
    label: string;
}

interface TransactionAuditToolbarProps {
    filters: TransactionAuditFilters;
    availableModules?: string[];
    availableActions?: string[];
    onFilterChange: (newFilters: TransactionAuditFilters) => void;
    onReset: () => void;
}

export const TransactionAuditToolbar: React.FC<TransactionAuditToolbarProps> = ({
    filters,
    availableModules = [],
    availableActions = [],
    onFilterChange,
    onReset,
}) => {
    const [search, setSearch] = useState(filters.search || '');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external filter changes
    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    function getDatePresetKey(from?: string | null, to?: string | null): string {
        if (!from && !to) return 'all';
        const today = new Date().toISOString().split('T')[0];
        if (from === today && to === today) return 'today';
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        if (from === d7.toISOString().split('T')[0] && to === today) return '7days';
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        if (from === d30.toISOString().split('T')[0] && to === today) return '30days';
        return 'custom';
    }

    const currentPreset = getDatePresetKey(filters.date_from, filters.date_to);
    const [showCustomDates, setShowCustomDates] = useState(currentPreset === 'custom');

    const viewMode = filters.view_mode || 'business';

    // Module options
    const moduleOptions: OptionType[] = useMemo(() => [
        { value: '', label: 'All Modules' },
        ...availableModules.map((m) => ({ value: m, label: m })),
    ], [availableModules]);

    // Action options
    const actionOptions: OptionType[] = useMemo(() => [
        { value: '', label: 'All Actions' },
        ...availableActions.map((a) => ({ value: a, label: a })),
    ], [availableActions]);

    // Date preset options
    const datePresetOptions: OptionType[] = useMemo(() => [
        { value: 'all', label: 'All Dates' },
        { value: 'today', label: 'Today' },
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'custom', label: 'Custom Range...' },
    ], []);

    const selectedModuleOption = moduleOptions.find((o) => o.value === (filters.module || '')) || moduleOptions[0];
    const selectedActionOption = actionOptions.find((o) => o.value === (filters.action || '')) || actionOptions[0];
    const selectedDateOption = datePresetOptions.find((o) => o.value === (showCustomDates ? 'custom' : currentPreset)) || datePresetOptions[0];

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            onFilterChange({
                ...filters,
                search: val.trim() || undefined,
                page: 1,
            });
        }, 350);
    };

    const handleClearSearch = () => {
        setSearch('');
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        onFilterChange({
            ...filters,
            search: undefined,
            page: 1,
        });
    };

    const handleModuleSelect = (selected: SingleValue<OptionType>) => {
        const val = selected?.value || '';
        onFilterChange({
            ...filters,
            module: val || undefined,
            page: 1,
        });
    };

    const handleActionSelect = (selected: SingleValue<OptionType>) => {
        const val = selected?.value || '';
        onFilterChange({
            ...filters,
            action: val || undefined,
            page: 1,
        });
    };

    const handleDatePresetSelect = (selected: SingleValue<OptionType>) => {
        const preset = selected?.value || 'all';
        const today = new Date().toISOString().split('T')[0];

        if (preset === 'all') {
            setShowCustomDates(false);
            onFilterChange({
                ...filters,
                date_from: undefined,
                date_to: undefined,
                page: 1,
            });
        } else if (preset === 'today') {
            setShowCustomDates(false);
            onFilterChange({
                ...filters,
                date_from: today,
                date_to: today,
                page: 1,
            });
        } else if (preset === '7days') {
            setShowCustomDates(false);
            const d7 = new Date();
            d7.setDate(d7.getDate() - 7);
            onFilterChange({
                ...filters,
                date_from: d7.toISOString().split('T')[0],
                date_to: today,
                page: 1,
            });
        } else if (preset === '30days') {
            setShowCustomDates(false);
            const d30 = new Date();
            d30.setDate(d30.getDate() - 30);
            onFilterChange({
                ...filters,
                date_from: d30.toISOString().split('T')[0],
                date_to: today,
                page: 1,
            });
        } else if (preset === 'custom') {
            setShowCustomDates(true);
        }
    };

    const handleCustomDateChange = (type: 'from' | 'to', val: string) => {
        onFilterChange({
            ...filters,
            [type === 'from' ? 'date_from' : 'date_to']: val || undefined,
            page: 1,
        });
    };

    const handleToggleViewMode = (mode: 'business' | 'technical') => {
        onFilterChange({
            ...filters,
            view_mode: mode,
            page: 1,
        });
    };

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.module ||
        filters.action ||
        filters.date_from ||
        filters.date_to ||
        (filters.view_mode && filters.view_mode !== 'business')
    );

    return (
        <div className="table-toolbar bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 space-y-3 w-full min-w-0">
            {/* View Mode Toggle Strip & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
                    <Button variant="tab"
                        type="button"
                        onClick={() => handleToggleViewMode('business')}
                                aria-pressed={viewMode === 'business'}
                        className="inline-flex items-center gap-1.5"
                        title="Show clean top-level business transactions with expandable details"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Business Events</span>
                    </Button>

                    <Button variant="tab"
                        type="button"
                        onClick={() => handleToggleViewMode('technical')}
                                aria-pressed={viewMode === 'technical'}
                        className="inline-flex items-center gap-1.5"
                        title="Show raw technical stream of all low-level system records"
                    >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>All Technical Events</span>
                    </Button>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {viewMode === 'business' ? (
                        <span>Showing consolidated business transaction groups</span>
                    ) : (
                        <span>Showing complete low-level forensic event stream</span>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search user, action, RIS number, reference, item name..."
                        className="ui-field table-control w-full pl-10 pr-9 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    {search && (
                        <Button variant="ghost" size="icon"
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            aria-label="Clear search"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                    {/* Module Select */}
                    <div className="w-full sm:w-44">
                        <Select
                            options={moduleOptions}
                            value={selectedModuleOption}
                            onChange={handleModuleSelect}
                            styles={institutionalSelectStyles}
                            isSearchable={false}
                            placeholder="Module"
                            instanceId="trx-module-filter-select"
                        />
                    </div>

                    {/* Action Select */}
                    <div className="w-full sm:w-48">
                        <Select
                            options={actionOptions}
                            value={selectedActionOption}
                            onChange={handleActionSelect}
                            styles={institutionalSelectStyles}
                            isSearchable={false}
                            placeholder="Action"
                            instanceId="trx-action-filter-select"
                        />
                    </div>

                    {/* Date Preset Select */}
                    <div className="w-full sm:w-36">
                        <Select
                            options={datePresetOptions}
                            value={selectedDateOption}
                            onChange={handleDatePresetSelect}
                            styles={institutionalSelectStyles}
                            isSearchable={false}
                            placeholder="Date"
                            instanceId="trx-date-preset-select"
                        />
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <Button variant="secondary"
                            type="button"
                            onClick={onReset}
                            className="inline-flex table-control items-center gap-1.5"
                            title="Reset all filters"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Custom Date Range Row */}
            {showCustomDates && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-sm bg-slate-50/50 dark:bg-slate-800/50 p-2 rounded-md">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Date Range:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-slate-500 dark:text-slate-400 text-sm font-semibold">From:</label>
                        <input
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleCustomDateChange('from', e.target.value)}
                            className="ui-field table-control px-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-red-900 focus:border-red-900"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-slate-500 dark:text-slate-400 text-sm font-semibold">To:</label>
                        <input
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => handleCustomDateChange('to', e.target.value)}
                            className="ui-field table-control px-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-red-900 focus:border-red-900"
                        />
                    </div>

                    {(filters.date_from || filters.date_to) && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => {
                                onFilterChange({
                                    ...filters,
                                    date_from: undefined,
                                    date_to: undefined,
                                    page: 1,
                                });
                            }}
                            className="underline ml-auto"
                        >
                            Clear dates
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
