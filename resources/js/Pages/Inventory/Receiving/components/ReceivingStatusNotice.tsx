import React from 'react';

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
            className={`p-4 rounded-lg border text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
                isSuccess
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
            }`}
            role="alert"
        >
            <div className="flex items-center gap-2.5">
                {isSuccess ? (
                    <svg
                        className="w-4 h-4 text-emerald-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="w-4 h-4 text-red-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                )}
                <span>{notification.message}</span>
            </div>
            <button
                type="button"
                onClick={onDismiss}
                className={`p-1 rounded-md transition-colors ${
                    isSuccess
                        ? 'text-emerald-700 hover:bg-emerald-100'
                        : 'text-red-700 hover:bg-red-100'
                }`}
                aria-label="Dismiss notice"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
