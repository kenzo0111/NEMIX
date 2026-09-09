import { useState, useMemo } from 'react';
import { Item } from './ItemSelector';
import { router } from '@inertiajs/react';

interface RFIDInventoryTableProps {
    items: Item[];
    selectedItemId?: number | null;
    onSelectItem: (item: Item) => void;
}

export default function RFIDInventoryTable({
    items,
    selectedItemId,
    onSelectItem,
}: RFIDInventoryTableProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [filter, setFilter] = useState<'all' | 'untagged' | 'tagged'>('all');

    const taggedCount = useMemo(() => items.filter((i) => i.rfid_tag).length, [items]);
    const untaggedCount = items.length - taggedCount;

    const filteredItems = useMemo(() => {
        if (filter === 'untagged') return items.filter((i) => !i.rfid_tag);
        if (filter === 'tagged') return items.filter((i) => i.rfid_tag);
        return items;
    }, [items, filter]);

    return (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            {/* Collapsible Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/70">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="inline-flex items-center gap-2 text-left cursor-pointer group"
                    >
                        <span className="text-gray-400 group-hover:text-gray-700 text-xs transition-transform">
                            {isCollapsed ? '▶' : '▼'}
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 font-serif tracking-tight">
                                Inventory RFID Records
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Reference list of tagged and untagged stock ({items.length} items total)
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter buttons */}
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100 text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                filter === 'all'
                                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            All ({items.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('untagged')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                filter === 'untagged'
                                    ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
                                    : 'text-amber-700 hover:text-amber-900'
                            }`}
                        >
                            Untagged ({untaggedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('tagged')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                filter === 'tagged'
                                    ? 'bg-emerald-100 text-emerald-900 font-bold shadow-2xs'
                                    : 'text-emerald-700 hover:text-emerald-900'
                            }`}
                        >
                            Tagged ({taggedCount})
                        </button>
                    </div>

                    {/* Direct link to Receiving */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('inventory.receiving'))}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-md transition-colors text-xs inline-flex items-center gap-1.5 font-mono cursor-pointer"
                    >
                        <span>Receiving</span>
                        <span>→</span>
                    </button>
                </div>
            </div>

            {/* Table Body (Collapsible) */}
            {!isCollapsed && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-600 font-bold uppercase tracking-wider font-mono text-[10px] border-b border-gray-200">
                                <th className="py-3 px-6">Item</th>
                                <th className="py-3 px-6">Property No.</th>
                                <th className="py-3 px-6">RFID Tag</th>
                                <th className="py-3 px-6 text-center">Status</th>
                                <th className="py-3 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400 italic text-xs">
                                        No items found matching the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isSelected = selectedItemId === item.id;
                                    const isTagged = !!item.rfid_tag;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition-colors border-b border-gray-100 last:border-0 ${
                                                isSelected
                                                    ? 'bg-red-50/60'
                                                    : 'hover:bg-gray-50/80'
                                            }`}
                                        >
                                            <td className="py-3.5 px-6">
                                                <div className="font-semibold text-gray-900 text-xs">
                                                    {item.name}
                                                </div>
                                                {item.supplier_name && (
                                                    <div className="text-[11px] text-gray-400">
                                                        {item.supplier_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 font-mono text-gray-600 text-xs">
                                                {item.sku || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-6 font-mono">
                                                {isTagged ? (
                                                    <span className="font-bold text-red-950 text-xs">
                                                        {item.rfid_tag}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-[11px]">
                                                        None
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                                        isTagged
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}
                                                >
                                                    {isTagged ? 'Tagged' : 'Not Tagged'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectItem(item);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
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
                                                        ? 'Manage Tag'
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
            )}
        </div>
    );
}
