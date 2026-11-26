import { Button } from '@/Components/ui/button';
import React from 'react';
import { ReceivingRecord, PaginatedData, ReceivingSortKey } from '../types';
import { ReceivingRow } from './ReceivingRow';
import type { SortDirection } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TablePagination from '@/Components/ui/table-pagination';
import { Inbox } from 'lucide-react';

interface ReceivingTableProps {
    receivings: ReceivingRecord[];
    paginationMeta: PaginatedData<ReceivingRecord> | null;
    onPageChange: (page: number) => void;
    onView: (receiving: ReceivingRecord) => void;
    onUpdate?: (receiving: ReceivingRecord) => void;
    sortKey: ReceivingSortKey;
    sortDirection: SortDirection;
    onSort: (key: ReceivingSortKey) => void;
    isFiltered: boolean;
}

export const ReceivingTable: React.FC<ReceivingTableProps> = ({
    receivings,
    paginationMeta,
    onPageChange,
    onView,
    onUpdate,
    sortKey,
    sortDirection,
    onSort,
    isFiltered,
}) => {
    const currentPage = paginationMeta ? paginationMeta.current_page : 1;
    const lastPage = paginationMeta ? paginationMeta.last_page : 1;
    const totalRecords = paginationMeta ? paginationMeta.total : receivings.length;
    const fromRecord = paginationMeta ? paginationMeta.from || (receivings.length > 0 ? 1 : 0) : (receivings.length > 0 ? 1 : 0);
    const toRecord = paginationMeta ? paginationMeta.to || receivings.length : receivings.length;

    return (
        <div className="overflow-hidden min-w-0 w-full">
            {/* Table */}
            <div className="overflow-x-auto min-w-0 w-full">
                <table className="ui-data-table w-full text-left border-collapse min-w-[60rem] divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="item" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-sm font-semibold tracking-normal text-left text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[12.5rem]">
                                Item Received
                            </SortableTableHeader>
                            <SortableTableHeader column="supplier" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-sm font-semibold tracking-normal text-left text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[11.25rem]">
                                Supplier
                            </SortableTableHeader>
                            <SortableTableHeader column="quantity" activeColumn={sortKey} direction={sortDirection} onSort={onSort} align="right" className="px-6 py-3.5 text-sm font-semibold tracking-normal text-right text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Received
                            </SortableTableHeader>
                            <SortableTableHeader column="remaining" activeColumn={sortKey} direction={sortDirection} onSort={onSort} align="right" className="px-6 py-3.5 text-sm font-semibold tracking-normal text-right text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Remaining
                            </SortableTableHeader>
                            <SortableTableHeader column="unit_cost" activeColumn={sortKey} direction={sortDirection} onSort={onSort} align="right" className="px-6 py-3.5 text-sm font-semibold tracking-normal text-right text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Unit Cost
                            </SortableTableHeader>
                            <SortableTableHeader column="amount" activeColumn={sortKey} direction={sortDirection} onSort={onSort} align="right" className="px-6 py-3.5 text-sm font-semibold tracking-normal text-right text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Batch Amount
                            </SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 text-sm font-semibold tracking-normal text-left text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Date Received
                            </SortableTableHeader>
                            <th scope="col" className="px-6 py-3.5 text-right text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[10rem]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                        {receivings.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-400 mb-2" strokeWidth={1.5} />
                                        <p className="leading-relaxed font-semibold text-sm text-slate-800 dark:text-slate-200">
                                            No receiving records found
                                        </p>
                                        {isFiltered ? (
                                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Try adjusting your search or supplier filter.
                                            </p>
                                        ) : (
                                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Incoming deliveries and supply acquisitions will appear here.
                                            </p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            receivings.map((receiving) => (
                                <ReceivingRow
                                    key={receiving.id}
                                    receiving={receiving}
                                    onView={onView}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {paginationMeta && (
                <TablePagination
                    currentPage={currentPage}
                    totalPages={lastPage}
                    totalRecords={totalRecords}
                    from={fromRecord}
                    to={toRecord}
                    onPageChange={onPageChange}
                    recordLabel="entries"
                />
            )}
        </div>
    );
};
