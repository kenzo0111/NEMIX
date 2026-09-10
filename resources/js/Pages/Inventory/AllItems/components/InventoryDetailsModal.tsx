import React from 'react';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';
import { X, Edit3, Tag, Package } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, formatNumber } from '../utils/inventory';
import InventoryStatus from './InventoryStatus';

interface InventoryDetailsModalProps {
    show: boolean;
    item: InventoryItem | null;
    onClose: () => void;
    onEdit: (item: InventoryItem) => void;
}

export default function InventoryDetailsModal({
    show,
    item,
    onClose,
    onEdit,
}: InventoryDetailsModalProps) {
    if (!item) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-red-950" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-red-50 text-red-950 flex items-center justify-center border border-red-100">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight font-serif">
                                Item Details
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Official university consumable inventory and property record.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body / Record Attributes */}
                <div className="p-6 space-y-5">
                    {/* Primary Identifier Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Item Name
                            </dt>
                            <dd className="mt-1 text-base font-bold text-gray-900">
                                {item.name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                SKU / Code
                            </dt>
                            <dd className="mt-1 text-sm font-mono font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">
                                {item.sku || 'N/A'}
                            </dd>
                        </div>
                    </div>

                    {/* Secondary Attributes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Supplier
                            </dt>
                            <dd className="mt-1 text-xs font-medium text-gray-800">
                                {item.supplier?.name || 'No Supplier Assigned'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Unit of Issue
                            </dt>
                            <dd className="mt-1 text-xs font-medium text-gray-800 uppercase font-mono">
                                {item.unit_of_issue || '—'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Inventory Status
                            </dt>
                            <dd className="mt-1">
                                <InventoryStatus status={item.status} />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Stock Level
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900 font-mono">
                                {formatNumber(item.stock)} units
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Unit Cost
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-gray-800 font-mono">
                                {formatCurrency(item.unit_cost)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                                Total Amount
                            </dt>
                            <dd className="mt-1 text-sm font-bold text-gray-900 font-mono">
                                {formatCurrency(item.amount)}
                            </dd>
                        </div>
                    </div>

                    {/* RFID Tag Value */}
                    <div className="pt-3 border-t border-gray-100">
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                            RFID Identification Tag
                        </dt>
                        <dd className="mt-1">
                            {item.rfid_tag ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-red-950/5 text-red-950 border border-red-900/10">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>{item.rfid_tag}</span>
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 font-normal">
                                    No RFID tag assigned to this item.
                                </span>
                            )}
                        </dd>
                    </div>

                    {/* Full Description */}
                    <div className="pt-3 border-t border-gray-100">
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                            Full Specifications / Description
                        </dt>
                        <dd className="mt-1 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50/70 p-3 rounded border border-gray-100 min-h-[60px]">
                            {item.description || 'No detailed specifications or notes recorded.'}
                        </dd>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('rfid-scanner.index', { item_id: item.id })}
                            className="px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                        >
                            <Tag className="w-3.5 h-3.5 text-red-900" />
                            <span>Tag RFID</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(item);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Item</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
