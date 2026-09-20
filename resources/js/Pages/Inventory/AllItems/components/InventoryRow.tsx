import React from 'react';
import { Link } from '@inertiajs/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreHorizontal, Tag, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';

interface InventoryRowProps {
    item: InventoryItem;
    onView: (item: InventoryItem) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
}

export default function InventoryRow({ item, onView, onEdit, onDelete }: InventoryRowProps) {
    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 group">
            {/* 1. Stock Number (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs font-mono font-semibold text-gray-800 dark:text-slate-200">
                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                    {item.sku || 'N/A'}
                </span>
            </td>

            {/* 2. Item Name & Mobile Stock No / RFID Badge */}
            <td className="px-4 sm:px-5 py-3.5 align-middle">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">{item.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.sku && (
                        <span className="md:hidden font-mono text-[11px] font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                            {item.sku}
                        </span>
                    )}
                    {item.rfid_tag && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-950 dark:text-red-400 font-medium">
                            <Tag className="w-3 h-3 text-red-900 dark:text-red-400" />
                            <span>RFID</span>
                        </span>
                    )}
                </div>
            </td>

            {/* 3. Description / Specification (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs text-gray-600 dark:text-slate-400 max-w-[200px] truncate" title={item.description || ''}>
                {item.description || '—'}
            </td>

            {/* 4. Unit of Issue (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs text-gray-700 dark:text-slate-300 font-medium uppercase font-mono">
                {item.unit_of_issue || '—'}
            </td>

            {/* 5. On Hand Stock */}
            <td className="px-4 sm:px-5 py-3.5 align-middle text-sm text-gray-900 dark:text-slate-100 font-semibold font-mono whitespace-nowrap">
                {formatNumber(item.on_hand ?? item.stock)}{' '}
                <span className="text-gray-500 dark:text-slate-400 text-xs font-normal font-sans">
                    {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                </span>
            </td>

            {/* 6. Total Inventory Value (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-gray-900 dark:text-slate-100 font-bold font-mono whitespace-nowrap">
                {formatCurrency(item.inventory_value ?? item.amount)}
            </td>

            {/* 7. Inventory Status */}
            <td className="px-3 sm:px-5 py-3.5 align-middle">
                <InventoryStatus status={item.status} />
            </td>

            {/* 8. Institutional Actions */}
            <td className="px-3 sm:px-5 py-3.5 align-middle text-right whitespace-nowrap text-xs">
                <div className="inline-flex items-center justify-end gap-1.5 sm:gap-2">
                    {/* View Action */}
                    <button
                        type="button"
                        onClick={() => onView(item)}
                        className="min-h-[36px] px-2.5 py-1.5 text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-xs transition-colors cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-slate-800 inline-flex items-center"
                    >
                        View
                    </button>

                    {/* Edit Action */}
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="min-h-[36px] px-2.5 sm:px-3 py-1.5 border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 font-semibold text-xs rounded transition-colors cursor-pointer shadow-2xs inline-flex items-center"
                    >
                        Edit
                    </button>

                    {/* More Menu Dropdown */}
                    <Menu as="div" className="relative inline-block text-left">
                        <MenuButton
                            className="min-h-[36px] min-w-[36px] p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-center"
                            title="More actions"
                            aria-label="More actions"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute right-0 z-30 mt-1 w-36 origin-top-right rounded-md bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                        >
                            <MenuItem>
                                {({ focus }) => (
                                    <Link
                                        href={route('rfid-scanner.index', { item_id: item.id })}
                                        className={`${
                                            focus ? 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'
                                        } flex items-center gap-2 w-full px-3 py-2 text-xs font-medium`}
                                    >
                                        <Tag className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                                        <span>Tag RFID</span>
                                    </Link>
                                )}
                            </MenuItem>
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(item)}
                                        className={`${
                                            focus ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'
                                        } flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </MenuItem>
                        </MenuItems>
                    </Menu>
                </div>
            </td>
        </tr>
    );
}
