import React from 'react';

type BadgeVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

interface StatusBadgeProps {
    status: string;
    variant?: BadgeVariant;
    dot?: boolean;
    className?: string;
}

export default function StatusBadge({
    status,
    variant,
    dot = true,
    className = '',
}: StatusBadgeProps) {
    const normalized = (status || '').trim().toLowerCase();

    // Auto-detect variant if not explicitly provided
    const resolvedVariant: BadgeVariant = variant || (() => {
        if (
            normalized === 'available' ||
            normalized === 'issued' ||
            normalized === 'active' ||
            normalized === 'success' ||
            normalized === 'verified' ||
            normalized === 'compliant' ||
            normalized === 'generated'
        ) {
            return 'success';
        }

        if (
            normalized === 'low stock' ||
            normalized === 'pending' ||
            normalized === 'pending renewal' ||
            normalized === 'logged' ||
            normalized === 'warning'
        ) {
            return 'warning';
        }

        if (
            normalized === 'out of stock' ||
            normalized === 'disabled' ||
            normalized === 'failed' ||
            normalized === 'cancelled' ||
            normalized === 'flagged' ||
            normalized === 'blacklisted' ||
            normalized === 'deleted'
        ) {
            return 'danger';
        }

        if (
            normalized === 'updated' ||
            normalized === 'modified' ||
            normalized === 'processing' ||
            normalized === 'historical migration' ||
            normalized === 'historical_migration'
        ) {
            return 'info';
        }

        return 'neutral';
    })();

    const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
        success: {
            container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            dot: 'bg-emerald-600',
        },
        warning: {
            container: 'bg-amber-50 text-amber-800 border-amber-200',
            dot: 'bg-amber-500',
        },
        danger: {
            container: 'bg-red-50 text-red-800 border-red-200',
            dot: 'bg-red-600',
        },
        info: {
            container: 'bg-sky-50 text-sky-800 border-sky-200',
            dot: 'bg-sky-500',
        },
        neutral: {
            container: 'bg-gray-100 text-gray-700 border-gray-200',
            dot: 'bg-gray-400',
        },
    };

    const style = variantStyles[resolvedVariant];
    const displayStatus = (status || '').replace(/_/g, ' ');

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tracking-wide uppercase font-mono ${style.container} ${className}`}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
            {displayStatus}
        </span>
    );
}
