import React from 'react';
import Modal from '@/Components/Modal';
import { Loader2 } from 'lucide-react';
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
        <Modal show={show} onClose={onClose} maxWidth="md" closeable={!isDeleting}>
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Subtle Red Top Accent Line for Destructive Action */}
                <div className="h-1.5 w-full bg-red-600" />

                <div className="p-6">
                    <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                        Delete Inventory Item
                    </h3>
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                        Are you sure you want to delete <span className="font-semibold text-gray-900">"{item.name}"</span>?
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        This action cannot be undone. The item will be archived from the active master list.
                    </p>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-xs"
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
