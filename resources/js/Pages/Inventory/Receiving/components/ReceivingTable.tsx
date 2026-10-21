import React from 'react';
import { ReceivingRecord, PaginatedData } from '../types';
import { ReceivingRow } from './ReceivingRow';

interface ReceivingTableProps {
    receivings: ReceivingRecord[];
    paginationMeta: PaginatedData<ReceivingRecord> | null;
    onPageChange: (page: number) => void;
    onView: (receiving: ReceivingRecord) => void;
    onUpdate: (receiving: ReceivingRecord) => void;
    isFiltered: boolean;
}

export const ReceivingTable: React.FC<ReceivingTableProps> = ({
    receivings,
    paginationMeta,
    onPageChange,
    onView,
    onUpdate,
    isFiltered,
}) => {
    const currentPage = paginationMeta ? paginationMeta.current_page : 1;
    const lastPage = paginationMeta ? paginationMeta.last_page : 1;
    const totalRecords = paginationMeta ? paginationMeta.total : receivings.length;
    const fromRecord = paginationMeta ? paginationMeta.from || (receivings.length > 0 ? 1 : 0) : (receivings.length > 0 ? 1 : 0);
    const toRecord = paginationMeta ? paginationMeta.to || receivings.length : receivings.length;

    return (
        <div className="overflow-hidden min-w-0">
            {/* Table */}
            <div className="overflow-x-auto min-w-0">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                    <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-left text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Item Received
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-left text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Supplier
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Received
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Remaining
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Unit Cost
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Batch Amount
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-left text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Date Received
                            </th>
                            <th className="px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                        {receivings.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <p className="leading-relaxed font-semibold text-sm text-gray-800 dark:text-slate-200">
                                            No receiving records found
                                        </p>
                                        {isFiltered ? (
                                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                Try adjusting your search or supplier filter.
                                            </p>
                                        ) : (
                                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
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
            <div className="px-6 lg:px-8 py-4 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                    Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{fromRecord}</span> to{' '}
                    <span className="font-semibold text-gray-900 dark:text-slate-200">{toRecord}</span> of{' '}
                    <span className="font-semibold text-gray-900 dark:text-slate-200">{totalRecords}</span> receiving records
                </span>

                {lastPage > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Go to previous page"
                            className="min-h-[38px] px-3.5 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="px-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                            Page {currentPage} of {lastPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
                            disabled={currentPage >= lastPage}
                            aria-label="Go to next page"
                            className="min-h-[38px] px-3.5 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
