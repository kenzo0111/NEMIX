import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { PaginationMeta, RFIDInventoryItem } from '../types';

declare function route(name: string, params?: any): string;

interface RFIDRecordsTableProps {
    items: RFIDInventoryItem[];
    records?: RFIDInventoryItem[];
    pagination?: PaginationMeta | null;
    filters?: {
        search?: string;
        status?: string;
    };
    selectedItemId?: number | null;
    onSelectItem: (item: RFIDInventoryItem) => void;
}

export default function RFIDRecordsTable({
    items,
    records,
    pagination,
    filters,
    selectedItemId,
    onSelectItem,
}: RFIDRecordsTableProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [localSearch, setLocalSearch] = useState(filters?.search || '');
    const [localStatus, setLocalStatus] = useState<'all' | 'untagged' | 'tagged'>(
        (filters?.status as 'all' | 'untagged' | 'tagged') || 'all'
    );

    // If backend records are not provided, filter client-side
    const displayItems = useMemo(() => {
        if (records && records.length > 0) {
            return records;
        }

        return items.filter((item) => {
            const matchesSearch =
                !localSearch ||
                item.name.toLowerCase().includes(localSearch.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(localSearch.toLowerCase())) ||
                (item.rfid_tag && item.rfid_tag.toLowerCase().includes(localSearch.toLowerCase()));

            const matchesStatus =
                localStatus === 'all' ||
                (localStatus === 'tagged' && Boolean(item.rfid_tag)) ||
                (localStatus === 'untagged' && !item.rfid_tag);

            return matchesSearch && matchesStatus;
        });
    }, [records, items, localSearch, localStatus]);

    const taggedCount = useMemo(() => items.filter((i) => i.rfid_tag).length, [items]);
    const untaggedCount = items.length - taggedCount;

    const handleServerFilterChange = (newStatus: 'all' | 'untagged' | 'tagged') => {
        setLocalStatus(newStatus);
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                {
                    search: localSearch,
                    status: newStatus,
                    page: 1,
                },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                {
                    search: localSearch,
                    status: localStatus,
                    page: 1,
                },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handlePageChange = (pageNumber: number) => {
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                {
                    search: localSearch,
                    status: localStatus,
                    page: pageNumber,
                },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            {/* Header: Collapsible section */}
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50/70 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="inline-flex items-center gap-2.5 text-left cursor-pointer group"
                    >
                        <span className="text-gray-400 group-hover:text-gray-700 text-xs transition-transform">
                            {isCollapsed ? 'Show ▾' : 'Hide ▴'}
                        </span>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 font-serif tracking-tight">
                                RFID Assignment Records
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Inventory registry reference ({taggedCount} tagged, {untaggedCount} untagged)
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">
                        {taggedCount} / {items.length} Tagged
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-xs font-medium text-red-900 hover:text-red-950 underline ml-2 cursor-pointer"
                    >
                        {isCollapsed ? 'Expand Records' : 'Collapse'}
                    </button>
                </div>
            </div>

            {/* Table content shown when expanded */}
            {!isCollapsed && (
                <div>
                    {/* Compact Filter Toolbar */}
                    <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
                            <input
                                type="text"
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                placeholder="Search by name, property no, or tag..."
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md placeholder-gray-400 focus:bg-white focus:border-red-950 focus:ring-1 focus:ring-red-950 shadow-2xs"
                            />
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors cursor-pointer"
                            >
                                Search
                            </button>
                        </form>

                        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100 text-xs">
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('all')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                    localStatus === 'all'
                                        ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                All ({items.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('untagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                    localStatus === 'untagged'
                                        ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Untagged ({untaggedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('tagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                    localStatus === 'tagged'
                                        ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Tagged ({taggedCount})
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 font-semibold text-[11px] border-b border-gray-200">
                                    <th className="py-3 px-6">Item</th>
                                    <th className="py-3 px-6">Property No.</th>
                                    <th className="py-3 px-6">RFID Tag</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    <th className="py-3 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-400 italic text-xs">
                                            No inventory records match the current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    displayItems.map((item) => {
                                        const isSelected = selectedItemId === item.id;
                                        const isTagged = Boolean(item.rfid_tag);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors border-b border-gray-100 last:border-0 ${
                                                    isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50/60'
                                                }`}
                                            >
                                                <td className="py-3 px-6">
                                                    <div className="font-medium text-gray-900 text-xs">
                                                        {item.name}
                                                    </div>
                                                    {item.supplier_name && (
                                                        <div className="text-[11px] text-gray-400">
                                                            {item.supplier_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 font-mono text-gray-600 text-xs">
                                                    {item.sku || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 font-mono">
                                                    {isTagged ? (
                                                        <span className="font-bold text-gray-900 text-xs">
                                                            {item.rfid_tag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px]">
                                                            None
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                isTagged ? 'bg-emerald-600' : 'bg-gray-400'
                                                            }`}
                                                        />
                                                        <span className={isTagged ? 'text-emerald-800' : 'text-gray-600'}>
                                                            {isTagged ? 'Tagged' : 'Untagged'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectItem(item);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-red-950 text-white shadow-2xs'
                                                                : isTagged
                                                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                                : 'bg-red-900 hover:bg-red-950 text-white shadow-2xs'
                                                        }`}
                                                    >
                                                        {isSelected
                                                            ? 'Selected'
                                                            : isTagged
                                                            ? 'Manage'
                                                            : 'Tag RFID'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Server-side Pagination footer if paginator present */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                            <div>
                                Showing {pagination.from ?? 0} to {pagination.to ?? 0} of {pagination.total} records
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page <= 1}
                                    className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <span className="px-2 font-mono">
                                    {pagination.current_page} / {pagination.last_page}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
