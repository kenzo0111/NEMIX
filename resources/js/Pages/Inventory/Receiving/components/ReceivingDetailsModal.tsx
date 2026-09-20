import React from 'react';
import Modal from '@/Components/Modal';
import { ReceivingRecord } from '../types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { PackageCheck, X, Edit3 } from 'lucide-react';

interface ReceivingDetailsModalProps {
    show: boolean;
    onClose: () => void;
    receiving: ReceivingRecord | null;
    onEdit: (receiving: ReceivingRecord) => void;
}

export const ReceivingDetailsModal: React.FC<ReceivingDetailsModalProps> = ({
    show,
    onClose,
    receiving,
    onEdit,
}) => {
    if (!receiving) return null;

    const formattedDate =
        formatDisplayDate(receiving.date || receiving.date_received, 'long') ||
        receiving.date;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md" ariaLabel="Receiving Record Details">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Institutional Maroon Accent Line */}
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 w-full shrink-0" />

                {/* Header */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                            <PackageCheck className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight truncate">
                                Receiving Record
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                                Transaction Reference #{receiving.id}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Definition Layout */}
                <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
                    <dl className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Item</dt>
                            <dd className="mt-1 font-semibold text-gray-900 dark:text-slate-100 sm:col-span-2 sm:mt-0 text-sm">
                                {receiving.item}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">SKU / Code</dt>
                            <dd className="mt-1 font-mono text-gray-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">
                                {receiving.sku || 'N/A'}
                            </dd>
                        </div>
                        {receiving.scanned_rfid_tag && <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Scanned item-type tag</dt><dd className="mt-1 font-mono text-gray-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">{receiving.scanned_rfid_tag}</dd></div>}
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Supplier</dt>
                            <dd className="mt-1 font-medium text-gray-800 dark:text-slate-200 sm:col-span-2 sm:mt-0">
                                {receiving.supplier || 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Supplier Stock No.</dt>
                            <dd className="mt-1 font-mono text-gray-800 dark:text-slate-200 sm:col-span-2 sm:mt-0">
                                {receiving.supplier_stock_no ? (
                                    <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                                        {receiving.supplier_stock_no}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 dark:text-slate-500 italic">Not recorded</span>
                                )}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Quantity Received</dt>
                            <dd className="mt-1 font-semibold text-gray-900 dark:text-slate-100 sm:col-span-2 sm:mt-0 font-mono">
                                <span className="text-emerald-700 dark:text-emerald-400 mr-1">+</span>
                                {receiving.quantity} {receiving.unit || 'pcs'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Batch Remaining</dt>
                            <dd className="mt-1 font-semibold sm:col-span-2 sm:mt-0 font-mono">
                                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                                    <span className={receiving.quantity_remaining > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}>
                                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 dark:text-slate-500 italic">N/A</span>
                                )}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Unit Cost</dt>
                            <dd className="mt-1 font-mono text-gray-900 dark:text-slate-100 sm:col-span-2 sm:mt-0">
                                {receiving.unit_cost !== null && receiving.unit_cost !== undefined
                                    ? `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Batch Value</dt>
                            <dd className="mt-1 font-mono font-bold text-gray-900 dark:text-slate-100 sm:col-span-2 sm:mt-0">
                                {receiving.amount !== null && receiving.amount !== undefined
                                    ? `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : receiving.unit_cost
                                    ? `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date Recorded</dt>
                            <dd className="mt-1 text-gray-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">
                                {formattedDate}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-2xs text-center cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(receiving);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-900 dark:border-red-700/60 text-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer text-center"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Record</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
