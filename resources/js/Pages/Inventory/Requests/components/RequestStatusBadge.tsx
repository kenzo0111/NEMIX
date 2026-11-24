import React from 'react';
import StatusBadge, { type StatusTone } from '@/Components/ui/status-badge';
import { SupplyRequest } from '../types';
const statuses: Record<SupplyRequest['status'], { label: string; tone: StatusTone }> = {
    'Pending Verification': { label: 'Pending Verification', tone: 'warning' },
    'For Correction': { label: 'For Correction', tone: 'danger' },
    'Under Review': { label: 'Under Review', tone: 'warning' },
    'Ready for Pickup': { label: 'Ready for Pickup', tone: 'info' },
    Released: { label: 'Released', tone: 'success' },
    Pending: { label: 'Pending Review', tone: 'warning' },
    Approved: { label: 'Approved · Awaiting Release', tone: 'info' },
    Issued: { label: 'Issued · Released', tone: 'success' },
    Rejected: { label: 'Rejected', tone: 'danger' },
    Cancelled: { label: 'Cancelled', tone: 'neutral' },
    'Pre-Requested': { label: 'Pre-Requested · Awaiting Replenishment', tone: 'warning' },
    'Stock Restocked': { label: 'Stock Restocked · Ready for Requisition', tone: 'success' },
};
export function RequestStatusBadge({ status }: { status: SupplyRequest['status'] }) {
    const item = statuses[status] || statuses.Pending;
    return <StatusBadge tone={item.tone}>{item.label}</StatusBadge>;
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
            <span className="tabular-nums font-medium text-gray-800 dark:text-slate-200">
                {requested} <span className="text-slate-500 text-sm font-sans dark:text-slate-300">{unit}</span>
            </span>
        );
    }

    const isAdjusted = approved !== requested;

    return (
        <div className="inline-flex flex-col items-start tabular-nums">
            <div className="flex items-center gap-1.5">
                <span className={`font-semibold ${isAdjusted ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-slate-100"}`}>
                    {approved}
                </span>
                <span className="text-slate-500 text-sm font-sans dark:text-slate-300">
                    / {requested} {unit}
                </span>
            </div>
            {isAdjusted && (
                <span className="text-sm normal-case font-sans font-semibold text-amber-600 dark:text-amber-400">
                    Adjusted by Custodian
                </span>
            )}
        </div>
    );
}
