import React from 'react';
import { SupplierStatus } from '../types';

interface SupplierStatusBadgeProps {
    status: SupplierStatus | string;
}

export const SupplierStatusBadge: React.FC<SupplierStatusBadgeProps> = ({ status }) => {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'active') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                Active / Compliant
            </span>
        );
    }

    if (normalized === 'blacklisted') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-500"></span>
                Blacklisted
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-500"></span>
            Pending Renewal
        </span>
    );
};
