import React from 'react';
import Modal from '@/Components/Modal';
import { ReceivingRecord } from '../types';
import { formatDisplayDate } from '@/utils/dateUtils';

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
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Thin Maroon Accent Line */}
                <div className="h-1 bg-red-900 w-full" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Receiving Record
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Transaction Reference #{receiving.id}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Clean Definition Layout (No Nested Bordered Cards) */}
                <div className="p-6">
                    <dl className="divide-y divide-gray-100 text-xs">
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Item</dt>
                            <dd className="mt-1 font-semibold text-gray-900 sm:col-span-2 sm:mt-0 text-sm">
                                {receiving.item}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">SKU / Code</dt>
                            <dd className="mt-1 font-mono text-gray-700 sm:col-span-2 sm:mt-0">
                                {receiving.sku || 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Supplier</dt>
                            <dd className="mt-1 font-medium text-gray-800 sm:col-span-2 sm:mt-0">
                                {receiving.supplier || 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Quantity Received</dt>
                            <dd className="mt-1 font-semibold text-gray-900 sm:col-span-2 sm:mt-0 font-mono">
                                <span className="text-emerald-700 mr-1">+</span>
                                {receiving.quantity} {receiving.unit || 'pcs'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Batch Remaining</dt>
                            <dd className="mt-1 font-semibold sm:col-span-2 sm:mt-0 font-mono">
                                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                                    <span className={receiving.quantity_remaining > 0 ? 'text-emerald-700' : 'text-gray-500'}>
                                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">N/A</span>
                                )}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Unit Cost</dt>
                            <dd className="mt-1 font-mono text-gray-900 sm:col-span-2 sm:mt-0">
                                {receiving.unit_cost !== null && receiving.unit_cost !== undefined
                                    ? `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Batch Value</dt>
                            <dd className="mt-1 font-mono font-bold text-gray-900 sm:col-span-2 sm:mt-0">
                                {receiving.amount !== null && receiving.amount !== undefined
                                    ? `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : receiving.unit_cost
                                    ? `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-gray-500 uppercase tracking-wider">Date Received</dt>
                            <dd className="mt-1 text-gray-700 sm:col-span-2 sm:mt-0">
                                {formattedDate}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(receiving)}
                        className="inline-flex items-center px-4 py-2 border border-red-900 text-red-900 hover:bg-red-50 rounded-md font-semibold text-xs transition-colors shadow-2xs"
                    >
                        Update Record
                    </button>
                </div>
            </div>
        </Modal>
    );
};
