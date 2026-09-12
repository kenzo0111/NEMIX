import React from 'react';
import Modal from '@/Components/Modal';
import { SupplierDetailsModalProps } from '../types';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { CATEGORY_DISPLAY_LABEL } from '../constants';

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
    show,
    supplier,
    onClose,
    onEdit,
}) => {
    if (!supplier) return null;

    const formatCurrency = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || val === '') return '—';
        const num = Number(val);
        if (isNaN(num)) return '—';
        return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const totalReceivedVal = supplier.total_received_value ?? 0;
    const currentInventoryVal = supplier.current_inventory_value ?? supplier.contract_supplies_value ?? supplier.amount ?? 0;
    const batchCount = supplier.batch_count ?? 0;
    const totalRecQty = supplier.total_received_quantity ?? 0;
    const currentQty = supplier.current_quantity ?? 0;
    const hasContractValue = supplier.contract_value !== null && supplier.contract_value !== undefined && supplier.contract_value !== '';

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Supplier Information
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Official registry details for accredited vendor.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 text-xs">
                    {/* Business Information Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-3 border-b border-gray-200">
                            Business Information
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-gray-500 font-medium">Business Name</dt>
                                <dd className="text-sm font-semibold text-gray-900 mt-1">{supplier.name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Tax Identification Number (TIN)</dt>
                                <dd className="text-sm font-mono font-medium text-gray-900 mt-1">{supplier.tin || '—'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-gray-500 font-medium">Business Address</dt>
                                <dd className="text-xs text-gray-800 font-medium mt-1 leading-relaxed">{supplier.address || '—'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Registration Information Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-3 border-b border-gray-200">
                            Registration Information
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-gray-500 font-medium">Registration Number</dt>
                                <dd className="text-sm font-mono font-medium text-gray-900 mt-1">{supplier.reg_number || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Classification</dt>
                                <dd className="text-sm font-medium text-gray-900 mt-1">{CATEGORY_DISPLAY_LABEL}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Supply Activity & Compliance Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-3 border-b border-gray-200">
                            Supply Activity &amp; Compliance
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-gray-500 font-medium mb-1">Supplier Status</dt>
                                <dd>
                                    <SupplierStatusBadge status={supplier.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Receiving Batches</dt>
                                <dd className="text-sm font-mono font-semibold text-gray-900 mt-1">
                                    {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Total Quantity Received</dt>
                                <dd className="text-sm font-mono font-medium text-gray-900 mt-1">
                                    {totalRecQty.toLocaleString()} units
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Current Quantity Remaining</dt>
                                <dd className="text-sm font-mono font-medium text-gray-900 mt-1">
                                    {currentQty.toLocaleString()} units
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Total Received Value</dt>
                                <dd className="text-sm font-mono font-bold text-gray-900 mt-1">
                                    {formatCurrency(totalReceivedVal)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Current Inventory Value</dt>
                                <dd className="text-sm font-mono font-bold text-gray-900 mt-1">
                                    {formatCurrency(currentInventoryVal)}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Contract Information Section - Only rendered if formal contract recorded */}
                    {hasContractValue && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-3 border-b border-gray-200">
                                Contract Information
                            </h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-gray-500 font-medium">Awarded Contract Value</dt>
                                    <dd className="text-sm font-mono font-bold text-gray-900 mt-1">
                                        {formatCurrency(supplier.contract_value)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/75 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(supplier);
                        }}
                        className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-semibold transition-colors shadow-xs"
                    >
                        Update Supplier
                    </button>
                </div>
            </div>
        </Modal>
    );
};
