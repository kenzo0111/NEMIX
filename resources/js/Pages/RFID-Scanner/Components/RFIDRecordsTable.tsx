import { useState, useMemo, useEffect } from 'react';
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
    X,
    Filter,
} from 'lucide-react';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import useAuthorization from '@/Hooks/useAuthorization';
import { formatDisplayDate } from '@/utils/dateUtils';
import { compareSortValues, type SortValue } from '@/Hooks/useSortableData';

type RfidSortKey = 'name' | 'sku' | 'rfid' | 'status' | 'supplier' | 'updated';

declare function route(name: string, params?: any): string;

interface RFIDRecordsTableProps {
    items: RFIDInventoryItem[];
    records?: RFIDInventoryItem[];
    pagination?: PaginationMeta | null;
    filters?: {
        search?: string;
        status?: string;
        sort?: RfidSortKey;
        direction?: 'asc' | 'desc';
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
    const { can } = useAuthorization();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters?.search || '');
    const [localStatus, setLocalStatus] = useState<'all' | 'untagged' | 'tagged'>(
        (filters?.status as 'all' | 'untagged' | 'tagged') || 'all'
    );
    const [copiedTag, setCopiedTag] = useState<string | null>(null);
    const [pendingSelectionId, setPendingSelectionId] = useState<number | null>(selectedItemId || null);
    const [sort, setSort] = useState<RfidSortKey>(filters?.sort || 'updated');
    const [direction, setDirection] = useState<'asc' | 'desc'>(filters?.direction || 'desc');
    useEffect(() => {
        setLocalSearch(filters?.search || '');
        setLocalStatus((filters?.status as 'all' | 'untagged' | 'tagged') || 'all');
        setSort(filters?.sort || 'updated');
        setDirection(filters?.direction || 'desc');
    }, [filters?.search, filters?.status, filters?.sort, filters?.direction]);

    const handleCopyTag = (tag: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(tag);
        setCopiedTag(tag);
        setTimeout(() => setCopiedTag(null), 1800);
    };

    // If backend records are not provided, filter client-side
    const displayItems = useMemo(() => {
        if (records !== undefined) {
            return records;
        }

        const filteredItems = items.filter((item) => {
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
        const accessors: Record<RfidSortKey, (item: RFIDInventoryItem) => SortValue> = {
            name: item => item.name,
            sku: item => item.sku,
            rfid: item => item.rfid_tag,
            status: item => item.rfid_tag ? 0 : 1,
            supplier: item => item.supplier_name,
            updated: item => item.updated_at ? new Date(item.updated_at) : null,
        };
        return filteredItems.map((item, index) => ({ item, index })).sort((left, right) => {
            const comparison = compareSortValues(accessors[sort](left.item), accessors[sort](right.item), direction);
            if (comparison === 0) return left.index - right.index;
            return comparison;
        }).map(({ item }) => item);
    }, [records, items, localSearch, localStatus, sort, direction]);

    const pendingItem = displayItems.find(item => item.id === pendingSelectionId) || null;
    useEffect(() => {
        if (pendingSelectionId !== null && !displayItems.some(item => item.id === pendingSelectionId)) setPendingSelectionId(null);
    }, [displayItems, pendingSelectionId]);

    const queryParams = (overrides: Record<string, string | number>) => ({
        per_page: pagination?.per_page,
        search: localSearch,
        status: localStatus,
        sort,
        direction,
        ...overrides,
    });

    const handleSort = (column: RfidSortKey) => {
        const nextDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';
        setSort(column);
        setDirection(nextDirection);
        if (pagination) {
            router.get(route('rfid-scanner.index'), queryParams({ sort: column, direction: nextDirection, page: 1 }), { preserveState: true, preserveScroll: true });
        }
    };

    const taggedCount = useMemo(() => items.filter((i) => i.rfid_tag).length, [items]);
    const untaggedCount = items.length - taggedCount;
    const taggedPercent = items.length > 0 ? Math.round((taggedCount / items.length) * 100) : 0;

    const handleServerFilterChange = (newStatus: 'all' | 'untagged' | 'tagged') => {
        setLocalStatus(newStatus);
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                queryParams({ status: newStatus, page: 1 }),
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                queryParams({ page: 1 }),
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handleClearSearch = () => {
        setLocalSearch('');
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                queryParams({ search: '', page: 1 }),
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handlePageChange = (pageNumber: number) => {
        if (pagination) {
            router.get(
                route('rfid-scanner.index'),
                queryParams({ page: pageNumber }),
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-sans tracking-tight">
                                RFID Assignment Registry
                            </h3>
                            <span className="text-sm tabular-nums font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                                {taggedPercent}% Tagged
                            </span>
                        </div>
                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium">
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
                        <span className="text-sm tabular-nums text-gray-500 dark:text-slate-400">
                            {taggedCount}/{items.length}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
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
                    <div className="table-toolbar px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-none sm:max-w-sm">
                            <div className="relative w-full">
                                <input
                                    type="search"
                                    aria-label="Search RFID records"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    placeholder="Search by name, property no, or tag..."
                                    className="h-10 w-full pl-8 pr-7 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-red-950 dark:focus:border-red-600 focus:ring-1 focus:ring-red-950 dark:focus:ring-red-600 shadow-2xs transition-colors"
                                />
                                <Search className="pointer-events-none w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                {localSearch && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        aria-label="Clear RFID search"
                                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 absolute right-2 inset-y-0 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="h-10 px-3 text-sm bg-red-950 hover:bg-red-900 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                            >
                                Search
                            </button>
                        </form>

                        {/* Segmented Filter Control */}
                        <div className="inline-flex rounded-lg border border-gray-200/90 dark:border-slate-700 p-1 bg-gray-100/80 dark:bg-slate-800/80 text-sm shadow-2xs overflow-x-auto justify-between sm:justify-start">
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('all')}
                                aria-pressed={localStatus === 'all'}
                                className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'all'
                                        ? 'bg-red-950 text-white shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>All</span>
                                <span className="px-1.5 py-0.2 rounded-full text-sm bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 tabular-nums">
                                    {items.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('untagged')}
                                aria-pressed={localStatus === 'untagged'}
                                className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'untagged'
                                        ? 'bg-red-950 text-white shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>Untagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-sm bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 tabular-nums">
                                    {untaggedCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServerFilterChange('tagged')}
                                aria-pressed={localStatus === 'tagged'}
                                className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    localStatus === 'tagged'
                                        ? 'bg-red-950 text-white shadow-xs font-semibold'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <span>Tagged</span>
                                <span className="px-1.5 py-0.2 rounded-full text-sm bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 tabular-nums">
                                    {taggedCount}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto w-full min-w-0">
                        <table className="w-full min-w-[53rem] text-left text-sm divide-y divide-gray-200 dark:divide-slate-800 border-collapse">
                            <thead>
                                <tr className="bg-gray-50/60 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-semibold text-sm border-b border-gray-200 dark:border-slate-800">
                                    <SortableTableHeader column="name" activeColumn={sort} direction={direction} onSort={handleSort} className="py-3.5 px-6 whitespace-nowrap min-w-[12.5rem] align-middle">Item Description</SortableTableHeader>
                                    <SortableTableHeader column="sku" activeColumn={sort} direction={direction} onSort={handleSort} className="py-3.5 px-6 tabular-nums whitespace-nowrap align-middle">Property No.</SortableTableHeader>
                                    <SortableTableHeader column="rfid" activeColumn={sort} direction={direction} onSort={handleSort} className="py-3.5 px-6 tabular-nums whitespace-nowrap align-middle">RFID Tag ID</SortableTableHeader>
                                    <SortableTableHeader column="status" activeColumn={sort} direction={direction} onSort={handleSort} align="center" className="py-3.5 px-6 whitespace-nowrap align-middle">Status</SortableTableHeader>
                                    <th scope="col" className="py-3.5 px-6 text-right font-semibold text-sm whitespace-nowrap min-w-[10rem] align-middle">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                                <Filter className="w-6 h-6 mb-2 text-gray-300 dark:text-slate-600" />
                                                <p className="leading-relaxed text-sm font-medium text-gray-600 dark:text-slate-300">No matching items found</p>
                                                <p className="leading-relaxed text-sm text-gray-400 dark:text-slate-500 mt-1">Try adjusting your search or status filter</p>
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
                                                    isSelected ? 'bg-red-50/70 dark:bg-red-950/40' : 'hover:bg-red-50/20 dark:hover:bg-red-950/20'
                                                }`}
                                            >
                                                <td className="py-3.5 px-6 align-middle min-w-[12.5rem] break-words">
                                                    <div className="font-medium text-gray-900 dark:text-slate-100 text-sm">
                                                        {item.name}
                                                    </div>
                                                    {item.supplier_name && (
                                                        <div className="text-sm text-gray-400 dark:text-slate-500 break-words max-w-sm">
                                                            {item.supplier_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-6 align-middle tabular-nums text-gray-600 dark:text-slate-400 text-sm">
                                                    <span className="bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-300">
                                                        {item.sku || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 align-middle tabular-nums">
                                                    {isTagged ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyTag(item.rfid_tag!, e)}
                                                            title={copiedTag === item.rfid_tag ? 'Copied!' : 'Click to copy tag'}
                                                            className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-slate-100 text-sm bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-1 rounded transition-colors cursor-pointer group"
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
                                                        <span className="text-gray-400 dark:text-slate-500 italic text-sm px-2 py-0.5">
                                                            Untagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-6 align-middle text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border ${
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
                                                <td className="py-3.5 px-6 align-middle text-right whitespace-nowrap min-w-[10rem]">
                                                    <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onSelectItem(item);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className={`inline-flex items-center justify-center min-h-[2.25rem] h-[2.25rem] px-3 py-1.5 text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap gap-1.5 ${
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
                                                    </div>
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
                        <div className="px-4 sm:px-6 py-3.5 bg-gray-50/70 dark:bg-slate-950/70 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600 dark:text-slate-400 text-center sm:text-left">
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
                                <span className="px-2 tabular-nums text-gray-700 dark:text-slate-300 font-semibold">
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

