import Modal from '@/Components/Modal';
import { RFIDInventoryItem } from '../types';

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
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="relative bg-white rounded-xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                <div className="h-1 w-full bg-red-900" />
                <div className="p-4 sm:p-6">
                    <div className="mx-auto flex items-center justify-center h-11 w-11 rounded-full bg-red-50 text-red-800 mb-3 border border-red-100">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-1 font-serif">
                        Unassign RFID Tag?
                    </h3>

                    <p className="text-xs text-gray-600 mb-4 leading-relaxed max-w-xs mx-auto">
                        Remove RFID tag <strong className="font-mono text-gray-900">{item.rfid_tag}</strong> from{' '}
                        <strong className="text-gray-900">{item.name}</strong>?
                    </p>

                    <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-full sm:flex-1 py-2.5 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="w-full sm:flex-1 py-2.5 px-3.5 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                            {isProcessing ? 'Unassigning...' : 'Unassign RFID'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
