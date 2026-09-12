import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select, { SingleValue } from 'react-select';
import { Search, RotateCcw, Calendar as CalendarIcon, X } from 'lucide-react';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { LoginAuditFilters } from '../types';

interface OptionType {
    value: string;
    label: string;
}

interface LoginAuditToolbarProps {
    filters: LoginAuditFilters;
    availableRoles?: string[];
    availableStatuses?: { value: string; label: string }[];
    onFilterChange: (newFilters: LoginAuditFilters) => void;
    onReset: () => void;
}

export const LoginAuditToolbar: React.FC<LoginAuditToolbarProps> = ({
    filters,
    availableRoles = [],
    availableStatuses = [
        { value: 'login_success', label: 'Successful Login' },
        { value: 'login_failed', label: 'Failed Login' },
        { value: 'logout', label: 'Logged Out' },
    ],
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

    // Role options
    const roleOptions: OptionType[] = useMemo(() => [
        { value: '', label: 'All Roles' },
        ...availableRoles.map((r) => ({ value: r, label: r })),
        { value: 'Unknown', label: 'Unknown / Unassigned' },
    ], [availableRoles]);

    // Status options
    const statusOptions: OptionType[] = useMemo(() => [
        { value: '', label: 'All Statuses' },
        ...availableStatuses.map((s) => ({ value: s.value, label: s.label })),
    ], [availableStatuses]);

    // Date preset options
    const datePresetOptions: OptionType[] = useMemo(() => [
        { value: 'all', label: 'All Dates' },
        { value: 'today', label: 'Today' },
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'custom', label: 'Custom Range...' },
    ], []);

    const selectedRoleOption = roleOptions.find((o) => o.value === (filters.role || '')) || roleOptions[0];
    const selectedStatusOption = statusOptions.find((o) => o.value === (filters.status || '')) || statusOptions[0];
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

    const handleRoleSelect = (selected: SingleValue<OptionType>) => {
        const val = selected?.value || '';
        onFilterChange({
            ...filters,
            role: val || undefined,
            page: 1,
        });
    };

    const handleStatusSelect = (selected: SingleValue<OptionType>) => {
        const val = selected?.value || '';
        onFilterChange({
            ...filters,
            status: val || undefined,
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
            date_from: type === 'from' ? (val || undefined) : filters.date_from,
            date_to: type === 'to' ? (val || undefined) : filters.date_to,
            page: 1,
        });
    };

    const activeFilterCount = [
        filters.search,
        filters.role,
        filters.status,
        filters.date_from || filters.date_to,
    ].filter(Boolean).length;

    return (
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Input matching system-wide toolbars */}
                <div className="relative flex-1 min-w-[260px] max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search name, email, or IP address..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-md text-xs font-normal text-gray-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs placeholder-gray-400 transition-colors"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* React-Select Dropdowns matching other modules */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                    {/* Role Filter */}
                    <div className="w-full sm:w-44">
                        <Select<OptionType>
                            value={selectedRoleOption}
                            onChange={handleRoleSelect}
                            options={roleOptions}
                            placeholder="Filter by Role"
                            isSearchable={false}
                            styles={institutionalSelectStyles}
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="w-full sm:w-44">
                        <Select<OptionType>
                            value={selectedStatusOption}
                            onChange={handleStatusSelect}
                            options={statusOptions}
                            placeholder="Filter by Status"
                            isSearchable={false}
                            styles={institutionalSelectStyles}
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Date Period Filter */}
                    <div className="w-full sm:w-44">
                        <Select<OptionType>
                            value={selectedDateOption}
                            onChange={handleDatePresetSelect}
                            options={datePresetOptions}
                            placeholder="Date Period"
                            isSearchable={false}
                            styles={institutionalSelectStyles}
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Reset Button */}
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-md transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                            title="Reset all filters"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset ({activeFilterCount})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Date Range Row */}
            {showCustomDates && (
                <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs bg-gray-50/60 p-2.5 rounded-md">
                    <span className="font-semibold text-gray-700 inline-flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-red-900" />
                        Custom Date Range:
                    </span>
                    <div className="flex items-center gap-2">
                        <label htmlFor="date_from" className="text-gray-500 font-medium text-[11px]">From</label>
                        <input
                            id="date_from"
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleCustomDateChange('from', e.target.value)}
                            className="py-1 px-2.5 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="date_to" className="text-gray-500 font-medium text-[11px]">To</label>
                        <input
                            id="date_to"
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => handleCustomDateChange('to', e.target.value)}
                            className="py-1 px-2.5 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
