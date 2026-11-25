import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import React from 'react';
import Modal from '@/Components/Modal';
import { RFIDInventoryItem } from '../types';
import { AlertTriangle } from 'lucide-react';

interface UnassignRFIDModalProps {
    show: boolean;
    item: RFIDInventoryItem | null;
    isProcessing: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function UnassignRFIDModal({
    show,
    item,
    isProcessing,
    onConfirm,
    onClose,
}: UnassignRFIDModalProps) {
    if (!item) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="sm"
            closeable={!isProcessing}
            ariaLabel="Unassign RFID Tag"
        >
            <div className="h-1.5 w-full bg-red-600 shrink-0" />

            <DialogBody className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 mb-3.5 border border-red-200/80 dark:border-red-900/50">
                    <AlertTriangle className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
                    Unassign RFID Tag?
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed max-w-xs mx-auto">
                    Remove RFID tag <strong className="tabular-nums text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.rfid_tag}</strong> from{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{item.name}</strong>?
                </p>

                <div className="p-3 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-red-900 dark:text-red-300 text-sm leading-relaxed text-left">
                    The physical RFID card or sticker will be unlinked and become available for reassignment to another asset.
                </div>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row">
                <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-full sm:flex-1"
                >
                    Cancel
                </Button>
                <Button variant="danger"
                    type="button"
                    onClick={onConfirm}
                    loading={isProcessing}
                    className="w-full sm:flex-1"
                >
                    {isProcessing ? 'Unassigning...' : 'Unassign RFID'}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
