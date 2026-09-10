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
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '0 2px',
        minWidth: '160px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '500',
        backgroundColor: '#ffffff',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '7px 12px',
        fontSize: '0.8125rem',
        fontWeight: state.isSelected ? '600' : '500',
        cursor: 'pointer',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-xs">
            {/* Search and Status Dropdown */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search staff, email, role..."
                        className="w-full pl-8 pr-7 py-2 text-xs font-medium border border-gray-300 rounded-md focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white placeholder:text-gray-400"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold p-0.5 cursor-pointer"
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
                        className="px-3 py-2 text-xs font-semibold text-red-950 hover:bg-red-50 hover:border-red-900/50 border border-red-900/30 rounded-md transition-colors cursor-pointer shadow-2xs"
                        title="Reset all filters"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center shrink-0">
                {canAddStaff ? (
                    <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 text-amber-300" />
                        <span>Add Staff</span>
                    </button>
                ) : (
                    <div
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-md font-medium text-xs text-gray-400 select-none cursor-not-allowed"
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
