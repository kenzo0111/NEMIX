import React from 'react';
import { SupplierStatus } from '../types';

interface SupplierStatusBadgeProps {
    status: SupplierStatus | string;
}

export const SupplierStatusBadge: React.FC<SupplierStatusBadgeProps> = ({ status }) => {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'active') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                Active / Compliant
            </span>
        );
    }

    if (normalized === 'blacklisted') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200/80 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                Blacklisted
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
            Pending Renewal
        </span>
    );
};
