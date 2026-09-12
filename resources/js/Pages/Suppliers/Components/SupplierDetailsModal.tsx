import React from 'react';
import Modal from '@/Components/Modal';
import {
    Building2,
    MapPin,
    Hash,
    FileText,
    X,
    Edit3,
    Package,
    Layers,
    Boxes,
    CheckCircle2,
    Award,
    PhilippinePeso,
} from 'lucide-react';
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
            <div className="relative bg-white rounded-lg overflow-hidden shadow-xl border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-950 flex items-center justify-center border border-red-100/80 shadow-xs shrink-0">
                            <Building2 className="w-5 h-5 text-red-900" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                    Supplier Information
                                </h3>
                                <SupplierStatusBadge status={supplier.status} />
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Official registry details and inventory consignment ledger.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                    {/* Hero Business Identity Banner */}
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50/60 p-4 rounded-lg border border-gray-200/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider font-mono text-red-900 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                    {CATEGORY_DISPLAY_LABEL}
                                </span>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 font-serif mt-1.5">
                                    {supplier.name}
                                </h2>
                            </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                    <Hash className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tax ID (TIN)</div>
                                    <div className="font-mono font-bold text-gray-900">{supplier.tin || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Registration Number</div>
                                    <div className="font-mono font-bold text-gray-900">{supplier.reg_number || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Official Business Address Section */}
                    <div className="bg-white rounded-lg border border-gray-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                            <MapPin className="w-4 h-4 text-red-900" />
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                Official Business Address
                            </h4>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium mt-1">
                            {supplier.address || 'No official business address registered.'}
                        </p>
                    </div>

                    {/* Supply Activity & Financial Metrics */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-gray-100">
                            <Layers className="w-4 h-4 text-red-900" />
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                Supply Activity & Financial Metrics
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Total Received Value */}
                            <div className="bg-gray-50/70 border border-gray-200/70 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-gray-500 mb-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-gray-500">
                                        Received Value
                                    </span>
                                    <PhilippinePeso className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="text-sm font-mono font-bold text-gray-900">
                                    {formatCurrency(totalReceivedVal)}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    Lifetime deliveries
                                </span>
                            </div>

                            {/* Current Inventory Value */}
                            <div className="bg-gray-50/70 border border-gray-200/70 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-gray-500 mb-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-gray-500">
                                        Inventory Value
                                    </span>
                                    <Package className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="text-sm font-mono font-bold text-red-950">
                                    {formatCurrency(currentInventoryVal)}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    Current stock on hand
                                </span>
                            </div>

                            {/* Receiving Batches */}
                            <div className="bg-gray-50/70 border border-gray-200/70 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-gray-500 mb-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-gray-500">
                                        Batches Logged
                                    </span>
                                    <Boxes className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="text-sm font-mono font-bold text-gray-900">
                                    {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    Accepted consignments
                                </span>
                            </div>

                            {/* Stock Movement Quantity */}
                            <div className="bg-gray-50/70 border border-gray-200/70 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-gray-500 mb-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-gray-500">
                                        Unit Quantity
                                    </span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div className="text-sm font-mono font-bold text-gray-900">
                                    {currentQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ {totalRecQty.toLocaleString()}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    Remaining / Received units
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contract Information Section - Only rendered if formal contract recorded */}
                    {hasContractValue && (
                        <div className="bg-amber-50/50 rounded-lg border border-amber-200/70 p-4 shadow-xs">
                            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/50">
                                <Award className="w-4 h-4 text-amber-700" />
                                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                                    Contract Allocation
                                </h4>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                                <span className="text-xs font-medium text-amber-800">Awarded Contract Value:</span>
                                <span className="text-sm font-mono font-bold text-amber-950">
                                    {formatCurrency(supplier.contract_value)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/75 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(supplier);
                        }}
                        className="px-4 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white rounded-md text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Update Supplier</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
