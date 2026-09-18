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
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 group">
            {/* 1. Stock Number (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs font-mono font-semibold text-gray-800">
                <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {item.sku || 'N/A'}
                </span>
            </td>

            {/* 2. Item Name & Mobile Stock No / RFID Badge */}
            <td className="px-4 sm:px-5 py-3.5 align-middle">
                <div className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.sku && (
                        <span className="md:hidden font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {item.sku}
                        </span>
                    )}
                    {item.rfid_tag && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-950 font-medium">
                            <Tag className="w-3 h-3 text-red-900" />
                            <span>RFID</span>
                        </span>
                    )}
                </div>
            </td>

            {/* 3. Description / Specification (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs text-gray-600 max-w-[200px] truncate" title={item.description || ''}>
                {item.description || '—'}
            </td>

            {/* 4. Unit of Issue (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-xs text-gray-700 font-medium uppercase font-mono">
                {item.unit_of_issue || '—'}
            </td>

            {/* 5. On Hand Stock */}
            <td className="px-4 sm:px-5 py-3.5 align-middle text-sm text-gray-900 font-semibold font-mono whitespace-nowrap">
                {formatNumber(item.on_hand ?? item.stock)}{' '}
                <span className="text-gray-500 text-xs font-normal font-sans">
                    {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                </span>
            </td>

            {/* 6. Total Inventory Value (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-gray-900 font-bold font-mono whitespace-nowrap">
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
                        className="min-h-[36px] px-2.5 py-1.5 text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer rounded hover:bg-gray-100 inline-flex items-center"
                    >
                        View
                    </button>

                    {/* Edit Action */}
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="min-h-[36px] px-2.5 sm:px-3 py-1.5 border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs rounded transition-colors cursor-pointer shadow-2xs inline-flex items-center"
                    >
                        Edit
                    </button>

                    {/* More Menu Dropdown */}
                    <Menu as="div" className="relative inline-block text-left">
                        <MenuButton
                            className="min-h-[36px] min-w-[36px] p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer flex items-center justify-center"
                            title="More actions"
                            aria-label="More actions"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute right-0 z-30 mt-1 w-36 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                        >
                            <MenuItem>
                                {({ focus }) => (
                                    <Link
                                        href={route('rfid-scanner.index', { item_id: item.id })}
                                        className={`${
                                            focus ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                        } flex items-center gap-2 w-full px-3 py-2 text-xs font-medium`}
                                    >
                                        <Tag className="w-3.5 h-3.5 text-red-900" />
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
                                            focus ? 'bg-red-50 text-red-700' : 'text-red-600'
                                        } flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
