import React from 'react';
import { PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { InventoryItem, PaginationMeta } from '../types';
import InventoryRow from './InventoryRow';

interface InventoryTableProps {
    items: InventoryItem[];
    pagination?: PaginationMeta;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (item: InventoryItem) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
    isFiltered: boolean;
}

export default function InventoryTable({
    items = [],
    pagination,
    currentPage,
    totalPages,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    isFiltered,
}: InventoryTableProps) {
    const totalCount = pagination ? pagination.total : items.length;
    const fromCount = pagination ? pagination.from ?? (items.length > 0 ? 1 : 0) : Math.min(items.length, 1);
    const toCount = pagination ? pagination.to ?? items.length : items.length;

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Stock No.
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Item
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Description
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Unit
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                On Hand
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Inventory Value
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                Status
                            </th>
                            <th scope="col" className="px-5 py-3 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                            <PackageOpen className="w-6 h-6" />
                                        </div>
                                        <p className="font-semibold text-sm text-gray-800">No inventory items found</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isFiltered
                                                ? 'No items matched your active search or filter criteria. Try clearing or modifying your filters.'
                                                : 'There are currently no items registered in the inventory master list.'}
                                        </p>
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
                <div className="px-6 py-4 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-xs text-gray-600">
                    <div>
                        Showing <span className="font-semibold text-gray-900">{fromCount}</span>–<span className="font-semibold text-gray-900">{toCount}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> items
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Previous</span>
                        </button>

                        <span className="px-2 text-xs font-medium text-gray-700">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>

                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
