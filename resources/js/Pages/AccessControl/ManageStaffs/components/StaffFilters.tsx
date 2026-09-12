import React from 'react';
import Select, { StylesConfig } from 'react-select';
import { Search, UserPlus, Shield } from 'lucide-react';
import { SelectOption } from '../types';

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

const filterSelectStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#e5e7eb',
        borderWidth: '1px',
        padding: '0 2px',
        minWidth: '170px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '500',
        backgroundColor: '#f9fafb',
        transition: 'all 0.15s ease',
        '&:hover': {
            borderColor: '#7f1d1d',
            backgroundColor: '#ffffff',
        },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '8px 12px',
        fontSize: '0.8125rem',
        fontWeight: state.isSelected ? '600' : '500',
        cursor: 'pointer',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        zIndex: 50,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-gray-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
            {/* Search and Status Dropdown */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-64 min-w-0 flex-1 sm:flex-initial">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search staff, email, role..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-gray-50/50 hover:bg-white focus:bg-white placeholder:text-gray-400 transition-colors"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold p-1 cursor-pointer transition-colors"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-auto">
                    <Select<SelectOption, false>
                        options={statusOptions}
                        value={statusFilter}
                        onChange={onStatusFilterChange}
                        styles={filterSelectStyles}
                        placeholder="Filter by status"
                        isClearable
                    />
                </div>

                {/* Reset Filter Button */}
                {isFiltered && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-3 py-2 text-xs font-semibold text-red-950 hover:bg-red-50 hover:border-red-900/50 border border-red-900/30 rounded-lg transition-colors cursor-pointer shadow-2xs text-center"
                        title="Reset all filters"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center shrink-0 w-full sm:w-auto">
                {canAddStaff ? (
                    <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2.5 px-4 rounded-lg shadow-2xs transition-all duration-150 text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 text-amber-300" />
                        <span>Add Staff</span>
                    </button>
                ) : (
                    <div
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg font-medium text-xs text-gray-400 select-none cursor-not-allowed"
                        title="System Administrator privileges required to register staff"
                    >
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span>Add Staff (Restricted)</span>
                    </div>
                )}
            </div>
        </div>
    );
}
