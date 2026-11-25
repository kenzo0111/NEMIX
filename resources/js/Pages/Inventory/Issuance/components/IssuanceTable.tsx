import { Button } from '@/Components/ui/button';
import React from 'react';
import { IssuanceRecord, PaginatedData, IssuanceSortKey } from '../types';
import { IssuanceRow } from './IssuanceRow';
import type { SortDirection } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TablePagination from '@/Components/ui/table-pagination';

interface IssuanceTableProps {
    issuances: IssuanceRecord[];
    pagination?: PaginatedData<IssuanceRecord> | null;
    onPageChange: (page: number) => void;
    onViewDetails: (issuance: IssuanceRecord) => void;
    onViewRisForm: (issuance: IssuanceRecord) => void;
    sortKey: IssuanceSortKey;
    sortDirection: SortDirection;
    onSort: (key: IssuanceSortKey) => void;
}

export const IssuanceTable: React.FC<IssuanceTableProps> = ({
    issuances,
    pagination,
    onPageChange,
    onViewDetails,
    onViewRisForm,
    sortKey,
    sortDirection,
    onSort,
}) => {
    const currentPage = pagination?.current_page || 1;
    const lastPage = pagination?.last_page || 1;
    const totalRecords = pagination?.total ?? issuances.length;
    const fromRecord = pagination?.from ?? (totalRecords === 0 ? 0 : (currentPage - 1) * 10 + 1);
    const toRecord = pagination?.to ?? Math.min(currentPage * 10, totalRecords);

    return (
        <div className="overflow-hidden min-w-0 w-full">
            {/* Table Container */}
            <div className="overflow-x-auto min-w-0 w-full">
                <table className="ui-data-table w-full text-left border-collapse min-w-[60rem]">
                    <thead className="border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableTableHeader column="ris_number" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                RIS No.
                            </SortableTableHeader>
                            <SortableTableHeader column="recipient" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[11.25rem]">
                                Recipient / Office
                            </SortableTableHeader>
                            <SortableTableHeader column="item" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[11.25rem]">
                                Items Issued
                            </SortableTableHeader>
                            <SortableTableHeader column="quantity" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Total Quantity
                            </SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Date Issued
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-4 lg:px-6 py-3.5 text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap">
                                Status
                            </SortableTableHeader>
                            <th scope="col" className="px-4 lg:px-6 py-3.5 text-right text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-300 normal-case whitespace-nowrap min-w-[10rem]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                        {issuances.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-slate-300 dark:text-slate-400 mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="leading-relaxed font-semibold text-sm text-slate-800 dark:text-slate-200">No issuance records found</p>
                                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Recorded supply issuances and RIS forms will appear here.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            issuances.map((issuance) => (
                                <IssuanceRow
                                    key={issuance.id}
                                    issuance={issuance}
                                    onViewDetails={onViewDetails}
                                    onViewRisForm={onViewRisForm}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <TablePagination
                currentPage={currentPage}
                totalPages={lastPage}
                totalRecords={totalRecords}
                from={fromRecord}
                to={toRecord}
                onPageChange={onPageChange}
                recordLabel="records"
            />
        </div>
    );
};
