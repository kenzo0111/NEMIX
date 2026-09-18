import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface DeleteItemModalProps {
    show: boolean;
    item: InventoryItem | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteItemModal({
    show,
    item,
    isDeleting,
    onClose,
    onConfirm,
}: DeleteItemModalProps) {
    if (!item) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="md"
            closeable={!isDeleting}
            ariaLabel="Delete Inventory Item Confirmation"
        >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
                {/* Red Top Accent Line for Destructive Action */}
                <div className="h-1.5 w-full bg-red-600 shrink-0" />

                <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                    Delete Inventory Item
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    Decommission item master record
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 space-y-3">
                        <p className="leading-relaxed">
                            Are you sure you want to delete <strong className="text-gray-900 font-semibold">"{item.name}"</strong>?
                        </p>
                        {item.sku && (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Stock No. / SKU:</span>
                                <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                    {item.sku}
                                </span>
                            </div>
                        )}
                        <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200/80 text-red-900 text-xs leading-relaxed">
                            This action will archive the item from the active master list and catalog records.
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{isDeleting ? 'Deleting...' : 'Delete Item'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
