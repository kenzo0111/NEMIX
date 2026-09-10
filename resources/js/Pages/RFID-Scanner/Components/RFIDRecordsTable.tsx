import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { PaginationMeta, RFIDInventoryItem } from '../types';
import {
    TableProperties,
    Search,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Radio,
    Tag,
    X,
    Filter,
} from 'lucide-react';

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
    const [copiedTag, setCopiedTag] = useState<string | null>(null);

    const handleCopyTag = (tag: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(tag);
        setCopiedTag(tag);
        setTimeout(() => setCopiedTag(null), 1800);
    };

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
    const taggedPercent = items.length > 0 ? Math.round((taggedCount / items.length) * 100) : 0;

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

    const handleClearSearch = () => {
        setLocalSearch('');
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                {
                    search: '',
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
        <div className="bg-white rounded-xl shadow-2xs border border-gray-200/90 overflow-hidden">
            {/* Header: Collapsible section */}
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-3 text-left cursor-pointer group"
                >
                    <div className="w-9 h-9 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-2xs flex items-center justify-center group-hover:border-red-900/40 transition-colors">
                        <TableProperties className="w-4 h-4 text-red-950" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 font-serif tracking-tight">
                                RFID Assignment Registry
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                {taggedPercent}% Tagged
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                            {taggedCount} of {items.length} items configured • Click to {isCollapsed ? 'view records table' : 'hide'}
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    {/* Mini progress bar */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${taggedPercent}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                            {taggedCount}/{items.length}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                    >
                        <span>{isCollapsed ? 'Expand Registry' : 'Collapse'}</span>
                        {isCollapsed ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Table content shown when expanded */}
            {!isCollapsed && (
                <div>
                    {/* Compact Filter Toolbar */}
                    <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    placeholder="Search by name, property no, or tag..."
                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg placeholder-gray-400 focus:bg-white focus:border-red-950 focus:ring-1 focus:ring-red-950 shadow-2xs transition-colors"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                {localSearch && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="p-0.5 text-gray-400 hover:text-gray-600 absolute right-2 top-2"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                                Search
                            </button>
                        </form>

                        {/* Segmented Filter Control */}
                        <div className="inline-flex rounded-lg border border-gray-200/90 p-1 bg-gray-100/80 text-xs shadow-2xs">
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('all')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'all'
                                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <span>All</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-600 font-mono">
                                    {items.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('untagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'untagged'
                                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <span>Untagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100/80 text-amber-800 font-mono">
                                    {untaggedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('tagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'tagged'
                                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <span>Tagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100/80 text-emerald-800 font-mono">
                                    {taggedCount}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50/60 text-gray-500 font-semibold text-[11px] border-b border-gray-200">
                                    <th className="py-3 px-6">Item Description</th>
                                    <th className="py-3 px-6 font-mono">Property No.</th>
                                    <th className="py-3 px-6 font-mono">RFID Tag ID</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    <th className="py-3 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Filter className="w-6 h-6 mb-2 text-gray-300" />
                                                <p className="text-xs font-medium text-gray-600">No matching items found</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Try adjusting your search or status filter</p>
                                            </div>
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
                                                    isSelected ? 'bg-red-50/60' : 'hover:bg-gray-50/60'
                                                }`}
                                            >
                                                <td className="py-3 px-6">
                                                    <div className="font-medium text-gray-900 text-xs">
                                                        {item.name}
                                                    </div>
                                                    {item.supplier_name && (
                                                        <div className="text-[11px] text-gray-400 truncate max-w-xs">
                                                            {item.supplier_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 font-mono text-gray-600 text-xs">
                                                    <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200/80">
                                                        {item.sku || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 font-mono">
                                                    {isTagged ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyTag(item.rfid_tag!, e)}
                                                            title={copiedTag === item.rfid_tag ? 'Copied!' : 'Click to copy tag'}
                                                            className="inline-flex items-center gap-1.5 font-bold text-gray-900 text-xs bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/70 px-2 py-1 rounded transition-colors cursor-pointer group"
                                                        >
                                                            <Radio className="w-3 h-3 text-emerald-600" />
                                                            <span>{item.rfid_tag}</span>
                                                            {copiedTag === item.rfid_tag ? (
                                                                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-700 ml-0.5" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] px-2 py-0.5">
                                                            Untagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                                            isTagged
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                isTagged ? 'bg-emerald-600' : 'bg-amber-500'
                                                            }`}
                                                        />
                                                        <span>{isTagged ? 'Tagged' : 'Needs Tag'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectItem(item);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer shadow-2xs ${
                                                            isSelected
                                                                ? 'bg-red-950 text-white font-semibold'
                                                                : isTagged
                                                                ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                                                                : 'bg-red-900 hover:bg-red-950 text-white'
                                                        }`}
                                                    >
                                                        {isSelected
                                                            ? 'In Focus'
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
                        <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                            <div>
                                Showing <span className="font-semibold text-gray-900">{pagination.from ?? 0}</span> to{' '}
                                <span className="font-semibold text-gray-900">{pagination.to ?? 0}</span> of{' '}
                                <span className="font-semibold text-gray-900">{pagination.total}</span> records
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page <= 1}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-2xs font-medium"
                                >
                                    Previous
                                </button>
                                <span className="px-2 font-mono text-gray-700 font-semibold">
                                    {pagination.current_page} / {pagination.last_page}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-2xs font-medium"
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

