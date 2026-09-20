import React from 'react';
import Select from 'react-select';
import { SupplierToolbarProps, StatusOption } from '../types';
import { STATUS_OPTIONS, institutionalSelectStyles } from '../constants';

export const SupplierToolbar: React.FC<SupplierToolbarProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onResetFilters,
    hasActiveFilters,
    onOpenCreateModal,
}) => {
    return (
        <div className="p-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 bg-gray-50/40 dark:bg-slate-900/40 border-b border-gray-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 flex-1 min-w-0">
                {/* Search Input */}
                <div className="relative flex-grow sm:max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search supplier, TIN or registration..."
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-normal text-gray-900 dark:text-slate-100 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-xs placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
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
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-xs font-medium text-red-900 dark:text-red-400 hover:text-red-950 dark:hover:text-red-300 underline underline-offset-2 py-1.5 px-2 transition-colors cursor-pointer"
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            {/* Register Supplier Action (Matching Issuance primary action button styling) */}
            <button
                type="button"
                onClick={onOpenCreateModal}
                className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
            >
                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Register Supplier
            </button>
        </div>
    );
};
