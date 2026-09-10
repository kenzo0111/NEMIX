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
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6 text-center flex flex-col items-center">
                {type === 'success' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4 text-emerald-700">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {type === 'confirm' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4 text-amber-700">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                )}
                {type === 'error' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 text-red-700">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">{message}</p>
                <div className="flex gap-2.5 justify-center w-full">
                    {type === 'confirm' ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2 bg-red-900 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors"
                            >
                                Confirm
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-red-900 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
