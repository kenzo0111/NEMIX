import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw, Calendar as CalendarIcon, X, Filter, ChevronDown } from 'lucide-react';
import { LoginAuditFilters } from '../types';

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
        { value: 'login_success', label: 'Successful' },
        { value: 'login_failed', label: 'Failed' },
        { value: 'logout', label: 'Logged Out' },
    ],
    onFilterChange,
    onReset,
}) => {
    const [search, setSearch] = useState(filters.search || '');
    const [showCustomDates, setShowCustomDates] = useState(
        Boolean(filters.date_from || filters.date_to) &&
        !['today', '7days', '30days'].includes(getDatePresetKey(filters.date_from, filters.date_to))
    );
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

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        onFilterChange({
            ...filters,
            role: val || undefined,
            page: 1,
        });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        onFilterChange({
            ...filters,
            status: val || undefined,
            page: 1,
        });
    };

    const handleDatePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const preset = e.target.value;
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
                {/* Search */}
                <div className="relative flex-1 min-w-[280px] max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search name, email, or IP address..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Role Filter */}
                    <div className="relative min-w-[145px]">
                        <select
                            value={filters.role || ''}
                            onChange={handleRoleChange}
                            aria-label="Filter by Role"
                            className="w-full appearance-none py-2 pl-3 pr-8 text-xs font-semibold border border-gray-300 rounded-md bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all cursor-pointer"
                        >
                            <option value="">All Roles</option>
                            {availableRoles.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                            <option value="Unknown">Unknown / Unassigned</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[145px]">
                        <select
                            value={filters.status || ''}
                            onChange={handleStatusChange}
                            aria-label="Filter by Status"
                            className="w-full appearance-none py-2 pl-3 pr-8 text-xs font-semibold border border-gray-300 rounded-md bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            {availableStatuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Date Presets */}
                    <div className="relative min-w-[145px]">
                        <select
                            value={showCustomDates ? 'custom' : currentPreset}
                            onChange={handleDatePresetChange}
                            aria-label="Filter by Date Period"
                            className="w-full appearance-none py-2 pl-3 pr-8 text-xs font-semibold border border-gray-300 rounded-md bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all cursor-pointer"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="custom">Custom Range...</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Reset Button */}
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-md transition-colors shadow-2xs"
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
                <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs bg-gray-50/50 p-2 rounded-md">
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
