import React, { ReactNode } from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isProcessing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm Action',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isProcessing = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const iconMap = {
        danger: <AlertCircle className="w-6 h-6 text-red-700" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
        info: <Info className="w-6 h-6 text-sky-600" />,
    };

    const confirmButtonStyles = {
        danger: 'bg-red-900 hover:bg-red-950 text-white focus:ring-red-500 border-red-900',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 border-amber-600',
        info: 'bg-sky-800 hover:bg-sky-900 text-white focus:ring-sky-500 border-sky-800',
    };

    return (
        <Modal show={isOpen} onClose={() => !isProcessing && onCancel()} maxWidth="md" closeable={!isProcessing}>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xl">
                {/* Institutional top accent */}
                <div
                    className={`h-1.5 w-full ${
                        variant === 'danger'
                            ? 'bg-red-900'
                            : variant === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-sky-700'
                    }`}
                />

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={`p-2.5 rounded-full shrink-0 ${
                                variant === 'danger'
                                    ? 'bg-red-50 border border-red-200'
                                    : variant === 'warning'
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-sky-50 border border-sky-200'
                            }`}
                        >
                            {iconMap[variant]}
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                {title}
                            </h3>
                            <div className="mt-2 text-xs text-gray-600 leading-relaxed font-medium">
                                {message}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer ${confirmButtonStyles[variant]}`}
                    >
                        {isProcessing ? (
                            <>
                                <svg
                                    className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
