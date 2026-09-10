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
        <div className="overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">
                                Item Received
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">
                                Quantity
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">
                                Supplier
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">
                                Date Received
                            </th>
                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {receivings.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-gray-300 mb-2"
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
                                        <p className="font-semibold text-sm text-gray-800">
                                            No receiving records found
                                        </p>
                                        {isFiltered ? (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Try adjusting your search or supplier filter.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 mt-0.5">
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
            <div className="px-6 lg:px-8 py-4 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-600 font-medium">
                    Showing <span className="font-semibold text-gray-900">{fromRecord}</span> to{' '}
                    <span className="font-semibold text-gray-900">{toRecord}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalRecords}</span> receiving records
                </span>

                {lastPage > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                        >
                            Previous
                        </button>
                        <span className="px-2 text-xs text-gray-600 font-medium">
                            Page {currentPage} of {lastPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
                            disabled={currentPage >= lastPage}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
