import React from 'react';
import { SupplierTableProps } from '../types';
import { SupplierRow } from './SupplierRow';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TablePagination from '@/Components/ui/table-pagination';

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
        <div className="w-full min-w-0">
            {/* Table */}
            <div className="overflow-x-auto min-w-0 w-full">
                <table className="ui-data-table w-full text-left border-collapse min-w-[53rem]">
                    <thead className="border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="name" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal whitespace-nowrap min-w-[12.5rem]">
                                Supplier
                            </SortableTableHeader>
                            <SortableTableHeader column="registration" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal whitespace-nowrap min-w-[9.375rem]">
                                Registration
                            </SortableTableHeader>
                            <SortableTableHeader column="classification" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal whitespace-nowrap min-w-[8.75rem]">
                                Classification
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal whitespace-nowrap min-w-[7.5rem]">
                                Status
                            </SortableTableHeader>
                            <th scope="col" className="px-6 py-3.5 text-right text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal whitespace-nowrap min-w-[10rem]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
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
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    No consumable office supplies suppliers found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalCount}
                from={startIndex}
                to={endIndex}
                onPageChange={onPageChange}
                recordLabel="suppliers"
            />
        </div>
    );
};
