import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { SupplierToolbarProps, StatusOption } from '../types';
import { STATUS_OPTIONS, institutionalSelectStyles } from '../constants';
import useAuthorization from '@/Hooks/useAuthorization';

export const SupplierToolbar: React.FC<SupplierToolbarProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onResetFilters,
    hasActiveFilters,
    onOpenCreateModal,
}) => {
    const { can } = useAuthorization();
    return (
        <div className="table-toolbar p-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 flex-1 min-w-0">
                {/* Search Input */}
                <div className="relative flex-grow sm:max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search supplier, TIN or registration..."
                        className="ui-field table-control w-full pl-9 pr-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-normal text-slate-900 dark:text-slate-100 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                </div>

                {/* Status Dropdown */}
                <div className="w-full sm:w-48">
                    <Select<StatusOption>
                        options={STATUS_OPTIONS}
                        value={statusFilter}
                        onChange={(selected) => onStatusChange(selected)}
                        placeholder="All Statuses"
                        isClearable
                        classNamePrefix="react-select"
                        styles={institutionalSelectStyles}
                    />
                </div>

                {/* Reset Filters (Only when active) */}
                {hasActiveFilters && (
                    <Button variant="secondary"
                        type="button"
                        onClick={onResetFilters}
                        className="underline underline-offset-2"
                    >
                        Reset Filters
                    </Button>
                )}
            </div>

            {/* Register Supplier Action (Matching Issuance primary action button styling) */}
            {can('suppliers.store') && <Button variant="primary"
                type="button"
                onClick={onOpenCreateModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
            >
                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Register Supplier
            </Button>}
        </div>
    );
};
