import { Button } from '@/Components/ui/button';
import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ReceivingStatusNoticeProps {
    notification: {
        type: 'success' | 'error';
        message: string;
    } | null;
    onDismiss: () => void;
}

export const ReceivingStatusNotice: React.FC<ReceivingStatusNoticeProps> = ({
    notification,
    onDismiss,
}) => {
    if (!notification) return null;

    const isSuccess = notification.type === 'success';

    return (
        <div
            className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${isSuccess
    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300"}`}
            role="alert"
        >
            <div className="flex items-center gap-2.5">
                {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span>{notification.message}</span>
            </div>
            <Button variant="ghost" size="icon"
                type="button"
                onClick={onDismiss}
                className=""
                aria-label="Dismiss notice"
            >
                <X className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
};
