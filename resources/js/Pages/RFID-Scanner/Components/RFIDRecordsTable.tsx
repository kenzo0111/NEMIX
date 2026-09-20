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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/90 dark:border-slate-800 overflow-hidden">
            {/* Header: Collapsible section */}
            <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-3 text-left cursor-pointer group"
                >
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-2xs flex items-center justify-center group-hover:border-red-900/40 transition-colors">
                        <TableProperties className="w-4 h-4 text-red-950 dark:text-red-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 font-serif tracking-tight">
                                RFID Assignment Registry
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                                {taggedPercent}% Tagged
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                            {taggedCount} of {items.length} items configured • Click to {isCollapsed ? 'view records table' : 'hide'}
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    {/* Mini progress bar */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${taggedPercent}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                            {taggedCount}/{items.length}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                        <span>{isCollapsed ? 'Expand Registry' : 'Collapse'}</span>
                        {isCollapsed ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Table content shown when expanded */}
            {!isCollapsed && (
                <div>
                    {/* Compact Filter Toolbar */}
                    <div className="px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-none sm:max-w-sm">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    placeholder="Search by name, property no, or tag..."
                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-red-950 dark:focus:border-red-600 focus:ring-1 focus:ring-red-950 dark:focus:ring-red-600 shadow-2xs transition-colors"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
                                {localSearch && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 absolute right-2 top-2 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                            >
                                Search
                            </button>
                        </form>

                        {/* Segmented Filter Control */}
                        <div className="inline-flex rounded-lg border border-gray-200/90 dark:border-slate-700 p-1 bg-gray-100/80 dark:bg-slate-800/80 text-xs shadow-2xs overflow-x-auto justify-between sm:justify-start">
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('all')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'all'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>All</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-mono">
                                    {items.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('untagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'untagged'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>Untagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono">
                                    {untaggedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('tagged')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'tagged'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>Tagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                                    {taggedCount}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-xs divide-y divide-gray-200 dark:divide-slate-800">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-semibold text-[11px] border-b border-gray-200 dark:border-slate-800">
                                    <th className="py-3 px-6">Item Description</th>
                                    <th className="py-3 px-6 font-mono">Property No.</th>
                                    <th className="py-3 px-6 font-mono">RFID Tag ID</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    <th className="py-3 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                                <Filter className="w-6 h-6 mb-2 text-gray-300 dark:text-slate-600" />
                                                <p className="text-xs font-medium text-gray-600 dark:text-slate-300">No matching items found</p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Try adjusting your search or status filter</p>
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
                                                className={`transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 ${
                                                    isSelected ? 'bg-red-50/60 dark:bg-red-950/30' : 'hover:bg-gray-50/60 dark:hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <td className="py-3 px-6">
                                                    <div className="font-medium text-gray-900 dark:text-slate-100 text-xs">
                                                        {item.name}
                                                    </div>
                                                    {item.supplier_name && (
                                                        <div className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-xs">
                                                            {item.supplier_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 font-mono text-gray-600 dark:text-slate-400 text-xs">
                                                    <span className="bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-300">
                                                        {item.sku || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 font-mono">
                                                    {isTagged ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyTag(item.rfid_tag!, e)}
                                                            title={copiedTag === item.rfid_tag ? 'Copied!' : 'Click to copy tag'}
                                                            className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-slate-100 text-xs bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-1 rounded transition-colors cursor-pointer group"
                                                        >
                                                            <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                            <span>{item.rfid_tag}</span>
                                                            {copiedTag === item.rfid_tag ? (
                                                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-gray-400 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-300 ml-0.5" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-slate-500 italic text-[11px] px-2 py-0.5">
                                                            Untagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                                            isTagged
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                isTagged ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-amber-500'
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
                                                                ? 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
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
                        <div className="px-4 sm:px-6 py-3.5 bg-gray-50/70 dark:bg-slate-950/70 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-slate-400 text-center sm:text-left">
                            <div>
                                Showing <span className="font-semibold text-gray-900 dark:text-slate-100">{pagination.from ?? 0}</span> to{' '}
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{pagination.to ?? 0}</span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{pagination.total}</span> records
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page <= 1}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs font-medium"
                                >
                                    Previous
                                </button>
                                <span className="px-2 font-mono text-gray-700 dark:text-slate-300 font-semibold">
                                    {pagination.current_page} / {pagination.last_page}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs font-medium"
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

