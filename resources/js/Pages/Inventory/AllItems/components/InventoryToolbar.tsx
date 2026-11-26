import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { Supplier, SelectOption, InventoryStatus } from '../types';
import { customSelectStyles, STATUS_OPTIONS } from '../constants';
import useAuthorization from '@/Hooks/useAuthorization';

interface InventoryToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterSupplier: SelectOption<number> | null;
    onSupplierChange: (option: SelectOption<number> | null) => void;
    filterStatus: SelectOption<InventoryStatus> | null;
    onStatusChange: (option: SelectOption<InventoryStatus> | null) => void;
    suppliers: Supplier[];
    onResetFilters: () => void;
    onOpenCreateModal: () => void;
    readOnly?: boolean;
}

export default function InventoryToolbar({
    searchTerm,
    onSearchChange,
    filterSupplier,
    onSupplierChange,
    filterStatus,
    onStatusChange,
    suppliers = [],
    onResetFilters,
    onOpenCreateModal,
    readOnly = false,
}: InventoryToolbarProps) {
    const { can } = useAuthorization();
    const isFiltered = Boolean(searchTerm.trim() || filterSupplier || filterStatus);

    const supplierOptions: SelectOption<number>[] = suppliers.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    return (
        <div className="table-toolbar p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">All items</h2>
            </div>

            {/* Filter Controls & Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full 2xl:w-auto min-w-0">
                {/* Search Input */}
                <div className="relative flex-grow sm:w-64">
                    <label htmlFor="inventory-search-input" className="sr-only">
                        Search Inventory
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                        id="inventory-search-input"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search name or SKU..."
                        aria-label="Search inventory by name or SKU"
                        className="ui-field table-control w-full pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>

                {/* Supplier Filter */}
                <div className="w-full sm:w-44">
                    <Select
                        value={filterSupplier}
                        onChange={onSupplierChange}
                        options={supplierOptions}
                        placeholder="All Suppliers"
                        isClearable
                        styles={customSelectStyles}
                        classNamePrefix="react-select"
                        aria-label="Filter by Supplier"
                    />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-40">
                    <Select
                        value={filterStatus}
                        onChange={onStatusChange}
                        options={STATUS_OPTIONS}
                        placeholder="All Statuses"
                        isClearable
                        styles={customSelectStyles}
                        classNamePrefix="react-select"
                        aria-label="Filter by Status"
                    />
                </div>

                {/* Reset Filters (Only visible when filters active) */}
                {isFiltered && (
                    <Button variant="secondary"
                        type="button"
                        onClick={onResetFilters}
                        className="flex items-center justify-center gap-1.5"
                        title="Reset all filters"
                        aria-label="Reset all filters and clear search"
                    >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reset</span>
                    </Button>
                )}

                {/* Primary Action: Add Item */}
                {!readOnly && can('inventory.store') && <Button variant="primary"
                    type="button"
                    onClick={onOpenCreateModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4 text-amber-300" aria-hidden="true" />
                    <span>Add Item</span>
                </Button>}
            </div>
        </div>
    );
}
