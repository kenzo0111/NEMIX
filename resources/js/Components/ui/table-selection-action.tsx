import React from 'react';
import { Eye, MousePointerClick } from 'lucide-react';

interface TableSelectionActionProps {
    selectedLabel?: string | null;
    onAction: () => void;
    actionLabel?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function TableSelectionAction({
    selectedLabel,
    onAction,
    actionLabel = 'View / Edit selected',
    className = '',
    children,
}: TableSelectionActionProps) {
    return (
        <div className={`table-toolbar flex flex-col gap-3 border-b border-slate-200 bg-red-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-red-950/15 ${className}`}>
            <p className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
                <MousePointerClick className="h-4 w-4 shrink-0 text-red-900 dark:text-red-400" aria-hidden="true" />
                {selectedLabel ? (
                    <span className="truncate">Selected: <strong className="text-slate-900 dark:text-slate-100">{selectedLabel}</strong></span>
                ) : (
                    <span>Select one row to continue.</span>
                )}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {children}
            <button
                type="button"
                disabled={!selectedLabel}
                onClick={onAction}
                className="table-control inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-red-950 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:text-slate-300"
            >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {actionLabel}
            </button>
            </div>
        </div>
    );
}
