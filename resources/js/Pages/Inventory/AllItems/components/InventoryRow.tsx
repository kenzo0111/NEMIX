import { Button } from '@/Components/ui/button';
import React from 'react';
import { Link } from '@inertiajs/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreHorizontal, Tag, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';
import useAuthorization from '@/Hooks/useAuthorization';

interface InventoryRowProps {
    item: InventoryItem;
    onView: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
    readOnly?: boolean;
}

export default function InventoryRow({ item, onView, onEdit, onDelete, readOnly = false }: InventoryRowProps) {
    const { can } = useAuthorization();
    const canTag = !readOnly && can('rfid.view') && can('rfid.assign');
    const canDelete = !readOnly && can('inventory.destroy');

    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-0 group">
            {/* 1. Stock Number (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {item.sku || 'N/A'}
                </span>
            </td>

            {/* 2. Item Name & Mobile Stock No / RFID Badge */}
            <td className="px-4 sm:px-5 py-3.5 align-middle min-w-[200px]">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">{item.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.sku && (
                        <span className="md:hidden tabular-nums text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
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
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-slate-600 dark:text-slate-400 min-w-[180px] max-w-xs break-words" title={item.description || ''}>
                {item.description || '—'}
            </td>

            {/* 4. Unit of Issue (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-slate-700 dark:text-slate-300 font-medium normal-case tabular-nums">
                {item.unit_of_issue || '—'}
            </td>

            {/* 5. On Hand Stock */}
            <td className="px-4 sm:px-5 py-3.5 align-middle text-sm text-slate-900 dark:text-slate-100 font-semibold tabular-nums whitespace-nowrap">
                {formatNumber(item.on_hand ?? item.stock)}{' '}
                <span className="text-slate-500 dark:text-slate-400 text-sm font-normal font-sans">
                    {item.unit_of_issue ? item.unit_of_issue.toLowerCase() : 'units'}
                </span>
            </td>

            {/* 6. Total Inventory Value (Desktop) */}
            <td className="hidden md:table-cell px-5 py-3.5 align-middle text-sm text-slate-900 dark:text-slate-100 font-semibold tabular-nums whitespace-nowrap">
                {formatCurrency(item.inventory_value ?? item.amount)}
            </td>

            {/* 7. Inventory Status */}
            <td className="px-3 sm:px-5 py-3.5 align-middle">
                <InventoryStatus status={item.status} />
                {Number(item.pre_orders_count ?? 0) > 0 && (
                    <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300">
                            {item.pre_orders_count} DU{Number(item.pre_orders_count) > 1 ? 's' : ''} waiting ({item.pre_orders_demanded ?? 0} {item.unit_of_issue || 'units'})
                        </span>
                    </div>
                )}
            </td>

            {/* 8. Institutional Actions */}
            <td className="px-3 sm:px-5 py-3.5 align-middle text-right whitespace-nowrap min-w-[10rem] text-sm">
                <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                    {/* View Action */}
                    <Button variant="secondary"
                        type="button"
                        onClick={() => onView(item)}
                        className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                    >
                        View
                    </Button>

                    {/* Edit Action */}
                    {!readOnly && onEdit && can('inventory.update') && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onEdit(item)}
                            className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                        >
                            Edit
                        </Button>
                    )}

                    {/* More Menu Dropdown */}
                    {(canTag || (canDelete && onDelete)) && (
                        <Menu as="div" className="relative inline-block text-left">
                            <MenuButton
                                className="min-h-[2.25rem] min-w-[2.25rem] h-[2.25rem] w-[2.25rem] p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-center dark:text-slate-300"
                                title="More actions"
                                aria-label="More actions"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </MenuButton>

                            <MenuItems
                                transition
                                className="absolute right-0 z-30 mt-1 w-36 origin-top-right rounded-md bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                                {canTag && (
                                    <MenuItem>
                                        {({ focus }) => (
                                            <Link
                                                href={route('rfid-scanner.index', { item_id: item.id })}
                                                className={`${focus ? "bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"} flex items-center gap-2 w-full px-3 py-2 text-sm font-medium`}
                                            >
                                                <Tag className="w-3.5 h-3.5 text-red-900 dark:text-red-400" />
                                                <span>Tag RFID</span>
                                            </Link>
                                        )}
                                    </MenuItem>
                                )}
                                {canDelete && onDelete && (
                                    <MenuItem>
                                        {({ focus }) => (
                                            <Button variant="danger"
                                                type="button"
                                                onClick={() => onDelete(item)}
                                                className="flex items-center gap-2 w-full"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                <span>Delete</span>
                                            </Button>
                                        )}
                                    </MenuItem>
                                )}
                            </MenuItems>
                        </Menu>
                    )}
                </div>
            </td>
        </tr>
    );
}
