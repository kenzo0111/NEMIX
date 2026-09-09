import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    title?: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastItem | null;
    onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
    useEffect(() => {
        if (!toast) return;

        const duration = toast.duration || 4500;
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) return null;

    const iconMap = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    };

    const borderMap = {
        success: 'border-emerald-200 bg-white text-gray-900 border-l-4 border-l-emerald-600',
        error: 'border-red-200 bg-white text-gray-900 border-l-4 border-l-red-600',
        warning: 'border-amber-200 bg-white text-gray-900 border-l-4 border-l-amber-500',
        info: 'border-sky-200 bg-white text-gray-900 border-l-4 border-l-sky-600',
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div
                className={`p-4 rounded-lg shadow-lg border flex items-start gap-3 ${borderMap[toast.type]}`}
                role="status"
                aria-live="polite"
            >
                {iconMap[toast.type]}
                <div className="min-w-0 flex-1">
                    {toast.title && (
                        <h5 className="text-xs font-bold font-sans uppercase tracking-wider text-gray-900">
                            {toast.title}
                        </h5>
                    )}
                    <p className="text-xs font-medium text-gray-700 mt-0.5 leading-relaxed break-words">
                        {toast.message}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                    aria-label="Dismiss notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<ToastItem | null>(null);

    const showToast = (message: string, type: ToastType = 'success', title?: string) => {
        setToast({
            id: Math.random().toString(36).substring(2, 9),
            type,
            message,
            title,
        });
    };

    const clearToast = () => setToast(null);

    return {
        toast,
        showToast,
        clearToast,
    };
}
