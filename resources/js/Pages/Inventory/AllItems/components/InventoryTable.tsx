import React from 'react';
import { PackageOpen, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { InventoryItem, PaginationMeta } from '../types';
import InventoryRow from './InventoryRow';
import { InventorySortKey } from '../types';
import type { SortDirection } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

interface InventoryTableProps {
    items: InventoryItem[];
    totalItems?: number;
    pagination?: PaginationMeta;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
    sortKey: InventorySortKey;
    sortDirection: SortDirection;
    onSort: (key: InventorySortKey) => void;
    isFiltered: boolean;
    onResetFilters?: () => void;
    readOnly?: boolean;
}

export default function InventoryTable({
    items = [],
    totalItems,
    pagination,
    currentPage,
    totalPages,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    sortKey,
    sortDirection,
    onSort,
    isFiltered,
    onResetFilters,
    readOnly = false,
}: InventoryTableProps) {
    const itemsPerPage = 10;
    const totalCount = pagination ? pagination.total : (totalItems ?? items.length);
    const fromCount = pagination
        ? (pagination.from ?? (items.length > 0 ? 1 : 0))
        : (totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
    const toCount = pagination
        ? (pagination.to ?? items.length)
        : Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="w-full overflow-hidden min-w-0">
            <div className="overflow-x-auto min-w-0 w-full">
                <table className="w-full text-left border-collapse min-w-[60rem]">
                    <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="sku" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="hidden md:table-cell px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Stock No.
                            </SortableTableHeader>
                            <SortableTableHeader column="name" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[12.5rem]">
                                Item
                            </SortableTableHeader>
                            <SortableTableHeader column="description" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="hidden md:table-cell px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[11.25rem]">
                                Description
                            </SortableTableHeader>
                            <SortableTableHeader column="unit" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="hidden md:table-cell px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Unit
                            </SortableTableHeader>
                            <SortableTableHeader column="stock" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                On Hand
                            </SortableTableHeader>
                            <SortableTableHeader column="value" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="hidden md:table-cell px-4 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Inventory Value
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-3 sm:px-5 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Status
                            </SortableTableHeader>
                            <th scope="col" className="px-4 sm:px-5 py-3.5 text-right text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[10rem]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center text-gray-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mb-3">
                                            <PackageOpen className="w-6 h-6" />
                                        </div>
                                        <p className="leading-relaxed font-semibold text-sm text-gray-800 dark:text-slate-200">No inventory items found</p>
                                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {isFiltered
                                                ? 'No items matched your active search or filter criteria. Try clearing or modifying your filters.'
                                                : 'There are currently no items registered in the inventory master list.'}
                                        </p>
                                        {isFiltered && onResetFilters && (
                                            <button
                                                type="button"
                                                onClick={onResetFilters}
                                                className="mt-4 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                aria-label="Clear all active inventory filters"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                                                <span>Clear filters</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <InventoryRow
                                    key={item.id}
                                    item={item}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    readOnly={readOnly}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalCount > 0 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-sm text-gray-600 dark:text-slate-400">
                    <div>
                        Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{fromCount}</span>–<span className="font-semibold text-gray-900 dark:text-slate-200">{toCount}</span> of <span className="font-semibold text-gray-900 dark:text-slate-200">{totalCount}</span> items
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Go to previous page"
                            className="min-h-[40px] min-w-[40px] px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <span className="px-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>

                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Go to next page"
                            className="min-h-[40px] min-w-[40px] px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
