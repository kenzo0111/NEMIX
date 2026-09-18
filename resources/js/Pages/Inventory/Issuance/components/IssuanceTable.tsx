import React from 'react';
import { IssuanceRecord, PaginatedData } from '../types';
import { IssuanceRow } from './IssuanceRow';

interface IssuanceTableProps {
    issuances: IssuanceRecord[];
    pagination?: PaginatedData<IssuanceRecord> | null;
    onPageChange: (page: number) => void;
    onViewDetails: (issuance: IssuanceRecord) => void;
    onViewRisForm: (issuance: IssuanceRecord) => void;
}

export const IssuanceTable: React.FC<IssuanceTableProps> = ({
    issuances,
    pagination,
    onPageChange,
    onViewDetails,
    onViewRisForm,
}) => {
    const currentPage = pagination?.current_page || 1;
    const lastPage = pagination?.last_page || 1;
    const totalRecords = pagination?.total ?? issuances.length;
    const fromRecord = pagination?.from ?? (totalRecords === 0 ? 0 : (currentPage - 1) * 10 + 1);
    const toRecord = pagination?.to ?? Math.min(currentPage * 10, totalRecords);

    return (
        <div className="overflow-hidden min-w-0">
            {/* Table Container */}
            <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                RIS No.
                            </th>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Recipient / Office
                            </th>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Items Issued
                            </th>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Total Quantity
                            </th>
                            <th className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Date Issued
                            </th>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Status
                            </th>
                            <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono w-36">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {issuances.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="font-semibold text-sm text-gray-800">No issuance records found</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
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
            {totalRecords > 0 && (
                <div className="px-4 sm:px-6 lg:px-8 py-3.5 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-gray-600 font-medium">
                        Showing <span className="font-bold text-gray-900">{fromRecord}</span>–<span className="font-bold text-gray-900">{toRecord}</span> of{' '}
                        <span className="font-bold text-gray-900">{totalRecords}</span> records
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage <= 1}
                            aria-label="Go to previous page"
                            className="min-h-[38px] px-3.5 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600 font-medium px-1">
                            Page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
                            <span className="font-bold text-gray-900">{lastPage}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(currentPage + 1, lastPage))}
                            disabled={currentPage >= lastPage}
                            aria-label="Go to next page"
                            className="min-h-[38px] px-3.5 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
