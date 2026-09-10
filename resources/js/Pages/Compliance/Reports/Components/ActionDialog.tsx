import React from 'react';
import Modal from '@/Components/Modal';

interface ActionDialogProps {
    show: boolean;
    type: 'success' | 'confirm' | 'error';
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
}

export const ActionDialog: React.FC<ActionDialogProps> = ({
    show,
    type,
    title,
    message,
    onClose,
    onConfirm,
}) => {
    const accentBg =
        type === 'success'
            ? 'bg-emerald-600'
            : type === 'confirm'
            ? 'bg-amber-600'
            : 'bg-red-700';

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
                {/* Thin Type Accent Top Line */}
                <div className={`h-1 w-full shrink-0 ${accentBg}`} />

                <div className="p-6 text-center flex flex-col items-center">
                    {type === 'success' && (
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100/80 mb-4 text-emerald-600 shadow-2xs">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {type === 'confirm' && (
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100/80 mb-4 text-amber-600 shadow-2xs">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    )}
                    {type === 'error' && (
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-100/80 mb-4 text-red-600 shadow-2xs">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}

                    <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight mb-1.5">{title}</h3>
                    <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">{message}</p>

                    <div className="flex gap-2.5 justify-center w-full">
                        {type === 'confirm' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="flex-1 px-4 py-2 bg-red-900 text-white text-xs font-semibold rounded-lg hover:bg-red-950 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                                >
                                    Confirm
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-red-900 text-white text-xs font-semibold rounded-lg hover:bg-red-950 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

