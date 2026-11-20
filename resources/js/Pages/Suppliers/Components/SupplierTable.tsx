import React from 'react';
import { SupplierTableProps } from '../types';
import { SupplierRow } from './SupplierRow';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

export const SupplierTable: React.FC<SupplierTableProps> = ({
    suppliers,
    totalCount,
    currentPage,
    totalPages,
    onPageChange,
    onViewSupplier,
    onEditSupplier,
    sortKey,
    sortDirection,
    onSort,
}) => {
    const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
    const endIndex = Math.min(currentPage * 10, totalCount);

    return (
        <div>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead className="bg-gray-50/75 dark:bg-slate-900/75 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="name" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-slate-300 normal-case tracking-normal">
                                Supplier
                            </SortableTableHeader>
                            <SortableTableHeader column="registration" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-slate-300 normal-case tracking-normal">
                                Registration
                            </SortableTableHeader>
                            <SortableTableHeader column="classification" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-slate-300 normal-case tracking-normal">
                                Classification
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-slate-300 normal-case tracking-normal">
                                Status
                            </SortableTableHeader>
                            <th scope="col" className="px-6 py-3.5 text-right text-sm font-semibold text-gray-700 dark:text-slate-300 normal-case tracking-normal">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                        {suppliers.map((supplier) => (
                            <SupplierRow
                                key={supplier.id}
                                supplier={supplier}
                                onView={onViewSupplier}
                                onEdit={onEditSupplier}
                            />
                        ))}

                        {suppliers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400 font-medium">
                                    No consumable office supplies suppliers found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 text-sm">
                    <span className="text-gray-600 dark:text-slate-400 font-medium">
                        Showing <span className="font-semibold text-gray-900 dark:text-slate-100">{startIndex}</span> to{' '}
                        <span className="font-semibold text-gray-900 dark:text-slate-100">{endIndex}</span> of{' '}
                        <span className="font-semibold text-gray-900 dark:text-slate-100">{totalCount}</span> suppliers
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Go to previous page"
                            className="min-h-[38px] px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600 dark:text-slate-400 font-medium px-1">
                            Page <span className="font-semibold text-gray-900 dark:text-slate-100">{currentPage}</span> of{' '}
                            <span className="font-semibold text-gray-900 dark:text-slate-100">{totalPages}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            aria-label="Go to next page"
                            className="min-h-[38px] px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
