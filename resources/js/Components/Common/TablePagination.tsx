import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
}

export default function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    itemLabel = 'records',
}: TablePaginationProps) {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const safeTotalPages = Math.max(1, totalPages);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600 font-mono">
            <div>
                Showing <span className="font-bold text-gray-900">{startItem}</span> to{' '}
                <span className="font-bold text-gray-900">{endItem}</span> of{' '}
                <span className="font-bold text-gray-900">{totalItems}</span> {itemLabel}
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-sans text-xs font-semibold"
                    aria-label="Previous Page"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                <span className="px-3 py-1 font-semibold text-gray-800 bg-white border border-gray-200 rounded">
                    Page {currentPage} of {safeTotalPages}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= safeTotalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-sans text-xs font-semibold"
                    aria-label="Next Page"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
