import React from 'react';
import { SupplyRequest } from '../types';

export function RequestStatusBadge({ status }: { status: SupplyRequest['status'] }) {
    const config: Record<
        SupplyRequest['status'],
        { label: string; bg: string; text: string; border: string; dot: string }
    > = {
        Pending: {
            label: 'Pending Review',
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            text: 'text-amber-800 dark:text-amber-300',
            border: 'border-amber-200 dark:border-amber-800',
            dot: 'bg-amber-500',
        },
        Approved: {
            label: 'Approved · Awaiting Release',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
            text: 'text-blue-800 dark:text-blue-300',
            border: 'border-blue-200 dark:border-blue-800',
            dot: 'bg-blue-500',
        },
        Issued: {
            label: 'Issued · Released',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-800 dark:text-emerald-300',
            border: 'border-emerald-200 dark:border-emerald-800',
            dot: 'bg-emerald-500',
        },
        Rejected: {
            label: 'Rejected',
            bg: 'bg-rose-50 dark:bg-rose-950/40',
            text: 'text-rose-800 dark:text-rose-300',
            border: 'border-rose-200 dark:border-rose-800',
            dot: 'bg-rose-500',
        },
        Cancelled: {
            label: 'Cancelled',
            bg: 'bg-gray-100 dark:bg-slate-800',
            text: 'text-gray-700 dark:text-slate-300',
            border: 'border-gray-200 dark:border-slate-700',
            dot: 'bg-gray-400',
        },
    };

    const item = config[status] || config.Pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border leading-none whitespace-nowrap ${item.bg} ${item.text} ${item.border}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
            <span>{item.label}</span>
        </span>
    );
}

export function ItemQuantityDisplay({
    requested,
    approved,
    unit = 'pcs',
    status,
}: {
    requested: number;
    approved: number | null | undefined;
    unit?: string;
    status: SupplyRequest['status'];
}) {
    if (status === 'Pending' || approved === null || approved === undefined) {
        return (
            <span className="font-mono font-medium text-gray-800 dark:text-slate-200">
                {requested} <span className="text-gray-400 text-[11px] font-sans">{unit}</span>
            </span>
        );
    }

    const isAdjusted = approved !== requested;

    return (
        <div className="inline-flex flex-col items-start font-mono">
            <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isAdjusted ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-slate-100'}`}>
                    {approved}
                </span>
                <span className="text-gray-400 text-[11px] font-sans">
                    / {requested} {unit}
                </span>
            </div>
            {isAdjusted && (
                <span className="text-[10px] uppercase font-sans font-semibold text-amber-600 dark:text-amber-400">
                    Adjusted by Custodian
                </span>
            )}
        </div>
    );
}
