import { Button } from '@/Components/ui/button';
import React from 'react';
import Modal from '@/Components/Modal';
import { RFIDInventoryItem } from '../types';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
            <div className="relative bg-white rounded-xl shadow-none w-full overflow-hidden text-center dark:bg-slate-900">
                {/* Red Destructive Accent Line */}
                <div className="h-1.5 w-full bg-red-600 shrink-0" />

                <div className="p-5 sm:p-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-red-50 text-red-700 mb-3.5 border border-red-200/80 shadow-sm dark:text-red-300">
                        <AlertTriangle className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1 font-sans tracking-tight dark:text-slate-300">
                        Unassign RFID Tag?
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 leading-relaxed max-w-xs mx-auto dark:text-slate-300">
                        Remove RFID tag <strong className="tabular-nums text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 dark:text-slate-300">{item.rfid_tag}</strong> from{' '}
                        <strong className="text-gray-900 dark:text-slate-300">{item.name}</strong>?
                    </p>

                    <div className="p-3 rounded-lg bg-red-50/70 border border-red-200/80 text-red-900 text-sm leading-relaxed text-left mb-5 dark:text-red-300">
                        The physical RFID card or sticker will be unlinked and become available for reassignment to another asset.
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5">
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-full sm:flex-1 text-center"
                        >
                            Cancel
                        </Button>
                        <Button variant="danger"
                            type="button"
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 text-center"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Unassigning...</span>
                                </>
                            ) : (
                                <span>Unassign RFID</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
