import React from 'react';
import { SupplierTableProps } from '../types';
import { SupplierRow } from './SupplierRow';

export const SupplierTable: React.FC<SupplierTableProps> = ({
    suppliers,
    totalCount,
    currentPage,
    totalPages,
    onPageChange,
    onViewSupplier,
    onEditSupplier,
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
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                Registration
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                Classification
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
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

            {/* Pagination */}
            <div className="px-4 sm:px-6 lg:px-8 py-3.5 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-slate-400">
                <div>
                    Showing <span className="font-semibold text-gray-900 dark:text-slate-100">{totalCount === 0 ? 0 : `${startIndex}–${endIndex}`}</span> of{' '}
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{totalCount}</span> records
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium px-1">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
