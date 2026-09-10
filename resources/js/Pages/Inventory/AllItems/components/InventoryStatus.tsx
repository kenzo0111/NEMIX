import React from 'react';
import { InventoryStatus as StatusType } from '../types';

interface InventoryStatusProps {
    status: StatusType;
}

export default function InventoryStatus({ status }: InventoryStatusProps) {
    const config = {
        Available: {
            dot: 'bg-emerald-500',
            text: 'text-gray-700',
        },
        'Low Stock': {
            dot: 'bg-amber-500',
            text: 'text-amber-800',
        },
        'Out of Stock': {
            dot: 'bg-red-500',
            text: 'text-red-800',
        },
    }[status] || {
        dot: 'bg-gray-400',
        text: 'text-gray-600',
    };

    return (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
            <span className={config.text}>{status}</span>
        </div>
    );
}
