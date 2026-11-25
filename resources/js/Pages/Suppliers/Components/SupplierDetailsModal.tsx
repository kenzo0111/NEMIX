import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
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
import useAuthorization from '@/Hooks/useAuthorization';

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
    show,
    supplier,
    onClose,
    onEdit,
}) => {
    const { can } = useAuthorization();
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
        <Modal show={show} onClose={onClose} maxWidth="xl" ariaLabel="Supplier Information">
            <div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-none">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Header */}
                <DialogHeader className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                            <Building2 className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                                    Supplier Information
                                </h3>
                                <SupplierStatusBadge status={supplier.status} />
                            </div>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                Official registry details and inventory consignment ledger.
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"
                        type="button"
                        onClick={onClose}
                        className=""
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Content */}
                <DialogBody className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
                    {/* Hero Business Identity Banner */}
                    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                                <span className="inline-block text-sm font-semibold normal-case tracking-normal tabular-nums text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-2 py-0.5 rounded">
                                    {CATEGORY_DISPLAY_LABEL}
                                </span>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-sans mt-1.5">
                                    {supplier.name}
                                </h2>
                            </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                                    <Hash className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 normal-case tracking-normal">Tax ID (TIN)</div>
                                    <div className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">{supplier.tin || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 normal-case tracking-normal">Registration Number</div>
                                    <div className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">{supplier.reg_number || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Official Business Address Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <MapPin className="w-4 h-4 text-red-900 dark:text-red-400" />
                            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                Official Business Address
                            </h4>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium mt-1">
                            {supplier.address || 'No official business address registered.'}
                        </p>
                    </div>

                    {/* Supply Activity & Financial Metrics */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <Layers className="w-4 h-4 text-red-900 dark:text-red-400" />
                            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                Supply Activity & Financial Metrics
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Total Received Value */}
                            <div className="bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                                    <span className="text-sm font-semibold normal-case tracking-normal tabular-nums text-slate-500 dark:text-slate-400">
                                        Received Value
                                    </span>
                                    <PhilippinePeso className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="text-sm tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(totalReceivedVal)}
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Lifetime deliveries
                                </span>
                            </div>

                            {/* Current Inventory Value */}
                            <div className="bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                                    <span className="text-sm font-semibold normal-case tracking-normal tabular-nums text-slate-500 dark:text-slate-400">
                                        Inventory Value
                                    </span>
                                    <Package className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="text-sm tabular-nums font-semibold text-red-950 dark:text-red-400">
                                    {formatCurrency(currentInventoryVal)}
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Current stock on hand
                                </span>
                            </div>

                            {/* Receiving Batches */}
                            <div className="bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                                    <span className="text-sm font-semibold normal-case tracking-normal tabular-nums text-slate-500 dark:text-slate-400">
                                        Batches Logged
                                    </span>
                                    <Boxes className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="text-sm tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                    {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Accepted consignments
                                </span>
                            </div>

                            {/* Stock Movement Quantity */}
                            <div className="bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                                    <span className="text-sm font-semibold normal-case tracking-normal tabular-nums text-slate-500 dark:text-slate-400">
                                        Unit Quantity
                                    </span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="text-sm tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                                    {currentQty.toLocaleString('en-PH')} <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/ {totalRecQty.toLocaleString('en-PH')}</span>
                                </div>
                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Remaining / Received units
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contract Information Section - Only rendered if formal contract recorded */}
                    {hasContractValue && (
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/70 dark:border-amber-900/40 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/50 dark:border-amber-900/40">
                                <Award className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                <h4 className="text-base font-semibold text-amber-900 dark:text-amber-300 normal-case tracking-normal tabular-nums">
                                    Contract Allocation
                                </h4>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Awarded Contract Value:</span>
                                <span className="text-sm tabular-nums font-semibold text-amber-950 dark:text-amber-200">
                                    {formatCurrency(supplier.contract_value)}
                                </span>
                            </div>
                        </div>
                    )}
                </DialogBody>

                {/* Footer */}
                <DialogFooter className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                    <Button variant="secondary"
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto text-center"
                    >
                        Close
                    </Button>
                    {can('suppliers.update') && <Button variant="primary"
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(supplier);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-center"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Update Supplier</span>
                    </Button>}
                </DialogFooter>
            </div>
        </Modal>
    );
};
