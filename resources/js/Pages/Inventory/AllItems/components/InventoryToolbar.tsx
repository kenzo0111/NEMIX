import React from 'react';
import Select from 'react-select';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { Supplier, SelectOption, InventoryStatus } from '../types';
import { customSelectStyles, STATUS_OPTIONS } from '../constants';

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
}: InventoryToolbarProps) {
    const isFiltered = Boolean(searchTerm.trim() || filterSupplier || filterStatus);

    const supplierOptions: SelectOption<number>[] = suppliers.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    return (
        <div className="p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Inventory Master List</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Official master list of university consumable inventory items and property assets.
                </p>
            </div>

            {/* Filter Controls & Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-grow sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search name or SKU..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs placeholder-gray-400"
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
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-2.5 py-2 text-xs font-medium text-gray-600 hover:text-red-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
                        title="Reset all filters"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </button>
                )}

                {/* Primary Action: Add Item */}
                <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 text-white font-semibold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-wider cursor-pointer"
                >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add Item</span>
                </button>
            </div>
        </div>
    );
}
