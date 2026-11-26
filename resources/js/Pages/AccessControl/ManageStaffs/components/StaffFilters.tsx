import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { Search, UserPlus, Shield } from 'lucide-react';
import { SelectOption } from '../types';
import { institutionalSelectStyles } from '@/styles/selectStyles';

interface StaffFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: SelectOption | null;
    onStatusFilterChange: (option: SelectOption | null) => void;
    onResetFilters: () => void;
    onOpenCreateModal: () => void;
    canAddStaff: boolean;
}

const statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active Status' },
    { value: 'Disabled', label: 'Disabled Status' },
];

export default function StaffFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onResetFilters,
    onOpenCreateModal,
    canAddStaff,
}: StaffFiltersProps) {
    const isFiltered = Boolean(searchQuery || statusFilter);

    return (
        <div className="table-toolbar flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            {/* Search and Status Dropdown */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-64 min-w-0 flex-1 sm:flex-initial">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search staff, department, head..."
                        className="ui-field w-full pl-10 pr-9 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            aria-label="Clear search"
                        >
                            ✕
                        </Button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-auto">
                    <Select<SelectOption, false>
                        options={statusOptions}
                        value={statusFilter}
                        onChange={onStatusFilterChange}
                        styles={institutionalSelectStyles}
                        placeholder="Filter by status"
                        isClearable
                    />
                </div>

                {/* Reset Filter Button */}
                {isFiltered && (
                    <Button variant="secondary"
                        type="button"
                        onClick={onResetFilters}
                        className="text-center"
                        title="Reset all filters"
                    >
                        Reset
                    </Button>
                )}
            </div>

            {/* Primary Action Button */}
            {canAddStaff && (
                <div className="flex items-center shrink-0 w-full sm:w-auto">
                    <Button variant="primary"
                        type="button"
                        data-tour="system-admin-staff-add"
                        onClick={onOpenCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                    >
                        <UserPlus className="w-4 h-4 text-amber-300" />
                        <span>Add Staff</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
