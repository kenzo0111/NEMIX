import React from 'react';
import { PackageOpen, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { InventoryItem, PaginationMeta } from '../types';
import InventoryRow from './InventoryRow';

interface InventoryTableProps {
    items: InventoryItem[];
    totalItems?: number;
    pagination?: PaginationMeta;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (item: InventoryItem) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
    isFiltered: boolean;
    onResetFilters?: () => void;
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
    isFiltered,
    onResetFilters,
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
            <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left border-collapse min-w-full sm:min-w-[640px]">
                    <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            <th scope="col" className="hidden md:table-cell px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Stock No.
                            </th>
                            <th scope="col" className="px-4 sm:px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Item
                            </th>
                            <th scope="col" className="hidden md:table-cell px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Description
                            </th>
                            <th scope="col" className="hidden md:table-cell px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Unit
                            </th>
                            <th scope="col" className="px-4 sm:px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                On Hand
                            </th>
                            <th scope="col" className="hidden md:table-cell px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Inventory Value
                            </th>
                            <th scope="col" className="px-3 sm:px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono">
                                Status
                            </th>
                            <th scope="col" className="px-3 sm:px-5 py-3 text-[11px] font-bold tracking-wider text-right text-gray-700 dark:text-slate-300 uppercase font-mono">
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
                                        <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">No inventory items found</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                            {isFiltered
                                                ? 'No items matched your active search or filter criteria. Try clearing or modifying your filters.'
                                                : 'There are currently no items registered in the inventory master list.'}
                                        </p>
                                        {isFiltered && onResetFilters && (
                                            <button
                                                type="button"
                                                onClick={onResetFilters}
                                                className="mt-4 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalCount > 0 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-xs text-gray-600 dark:text-slate-400">
                    <div>
                        Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{fromCount}</span>–<span className="font-semibold text-gray-900 dark:text-slate-200">{toCount}</span> of <span className="font-semibold text-gray-900 dark:text-slate-200">{totalCount}</span> items
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Go to previous page"
                            className="min-h-[40px] min-w-[40px] px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <span className="px-2 text-xs font-medium text-gray-700 dark:text-slate-300">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>

                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Go to next page"
                            className="min-h-[40px] min-w-[40px] px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
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
