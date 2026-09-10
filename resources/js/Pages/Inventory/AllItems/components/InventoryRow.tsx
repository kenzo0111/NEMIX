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
            {/* 1. Item Name & Metadata */}
            <td className="px-5 py-3.5 align-middle">
                <div className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-mono">
                    <span>SKU: {item.sku || 'N/A'}</span>
                    {item.rfid_tag ? (
                        <span className="text-[11px] text-gray-500 font-sans font-normal">
                            • <span className="text-red-950 font-medium">RFID Tagged</span>
                        </span>
                    ) : null}
                </div>
            </td>

            {/* 2. Supplier */}
            <td className="px-5 py-3.5 align-middle text-sm text-gray-600 font-medium">
                {item.supplier?.name || 'No Supplier'}
            </td>

            {/* 3. Unit of Issue */}
            <td className="px-5 py-3.5 align-middle text-sm text-gray-600 lowercase">
                {item.unit_of_issue || '—'}
            </td>

            {/* 4. Stock Level */}
            <td className="px-5 py-3.5 align-middle text-sm text-gray-900 font-semibold font-mono">
                {formatNumber(item.stock)}{' '}
                <span className="text-gray-400 text-xs font-normal font-sans">units</span>
            </td>

            {/* 5. Unit Cost */}
            <td className="px-5 py-3.5 align-middle text-sm text-gray-700 font-medium font-mono">
                {formatCurrency(item.unit_cost)}
            </td>

            {/* 6. Inventory Status */}
            <td className="px-5 py-3.5 align-middle">
                <InventoryStatus status={item.status} />
            </td>

            {/* 7. Institutional Actions */}
            <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap text-xs">
                <div className="inline-flex items-center justify-end gap-2.5">
                    {/* View Action */}
                    <button
                        type="button"
                        onClick={() => onView(item)}
                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                    >
                        View
                    </button>

                    {/* Edit Action */}
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                    >
                        Edit
                    </button>

                    {/* More Menu Dropdown */}
                    <Menu as="div" className="relative inline-block text-left">
                        <MenuButton
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
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
                                        } flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium`}
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
                                        } flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium transition-colors`}
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
