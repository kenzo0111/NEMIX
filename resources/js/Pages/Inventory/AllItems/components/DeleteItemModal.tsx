import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, X } from 'lucide-react';
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
            <div className="h-1.5 w-full bg-red-600 shrink-0" />

            <DialogHeader className="items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-slate-900 dark:text-slate-100 truncate">
                            Delete Inventory Item
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Decommission item master record
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="shrink-0"
                    aria-label="Close dialog"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            <DialogBody className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
                <p className="leading-relaxed">
                    Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100 font-semibold">"{item.name}"</strong>?
                </p>
                {item.sku && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Stock No. / SKU:</span>
                        <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {item.sku}
                        </span>
                    </div>
                )}
                <div className="p-3.5 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-red-900 dark:text-red-300 text-sm leading-relaxed">
                    This action will archive the item from the active master list and catalog records.
                </div>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row">
                <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>
                <Button variant="danger"
                    type="button"
                    onClick={onConfirm}
                    loading={isDeleting}
                    className="w-full sm:w-auto"
                >
                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
