import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React from 'react';
import { Tag } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';

interface InventoryRowProps {
    item: InventoryItem;
    selected: boolean;
    onSelect: (item: InventoryItem) => void;
}

export default function InventoryRow({ item, selected, onSelect }: InventoryRowProps) {
    return (
        <tr   {...rowSelectionProps(selected, () => onSelect(item))}  className={`cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${selected ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}>
            {/* 1. Stock Number (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm tabular-nums font-semibold text-gray-800 dark:text-slate-200">
                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                    {item.sku || 'N/A'}
                </span>
            </td>

            {/* 2. Item Name & Mobile Stock No / RFID Badge */}
            <td className="px-4 sm:px-5 py-3.5 align-middle">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">{item.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.sku && (
                        <span className="md:hidden tabular-nums text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                            {item.sku}
                        </span>
                    )}
                    {item.rfid_tag && (
                        <span className="inline-flex items-center gap-1 text-sm text-red-950 dark:text-red-400 font-medium">
                            <Tag className="w-3 h-3 text-red-900 dark:text-red-400" />
                            <span>RFID</span>
                        </span>
                    )}
                </div>
            </td>

            {/* 3. Description / Specification (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-gray-600 dark:text-slate-400 max-w-[200px] truncate" title={item.description || ''}>
                {item.description || '—'}
            </td>

            {/* 4. Unit of Issue (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-gray-700 dark:text-slate-300 font-medium normal-case tabular-nums">
                {item.unit_of_issue || '—'}
            </td>

            {/* 5. On Hand Stock */}
            <td className="px-4 sm:px-5 py-3.5 align-middle text-sm text-gray-900 dark:text-slate-100 font-semibold tabular-nums whitespace-nowrap">
                {formatNumber(item.on_hand ?? item.stock)}{' '}
                <span className="text-gray-500 dark:text-slate-400 text-sm font-normal font-sans">
                    {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                </span>
            </td>

            {/* 6. Total Inventory Value (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-gray-900 dark:text-slate-100 font-bold tabular-nums whitespace-nowrap">
                {formatCurrency(item.inventory_value ?? item.amount)}
            </td>

            {/* 7. Inventory Status */}
            <td className="px-3 sm:px-5 py-3.5 align-middle">
                <InventoryStatus status={item.status} />
            </td>

        </tr>
    );
}
