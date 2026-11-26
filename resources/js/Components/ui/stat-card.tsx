import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type StatCardTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE_ACCENT: Record<StatCardTone, string> = {
    neutral: 'border-t-2 border-t-slate-400 dark:border-t-slate-500',
    brand: 'border-t-2 border-t-red-900 dark:border-t-red-700',
    success: 'border-t-2 border-t-emerald-600 dark:border-t-emerald-500',
    warning: 'border-t-2 border-t-amber-500 dark:border-t-amber-400',
    danger: 'border-t-2 border-t-rose-600 dark:border-t-rose-500',
    info: 'border-t-2 border-t-blue-600 dark:border-t-blue-500',
};

const ICON_TONE: Record<StatCardTone, string> = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
};

export interface StatCardProps {
    label: string;
    value: ReactNode;
    sublabel?: ReactNode;
    icon?: ReactNode;
    tone?: StatCardTone;
    active?: boolean;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export default function StatCard({
    label,
    value,
    sublabel,
    icon,
    tone = 'neutral',
    active = false,
    href,
    onClick,
    className,
}: StatCardProps) {
    const baseClasses = cn(
        'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm text-left transition-colors',
        TONE_ACCENT[tone],
        active && 'ring-2 ring-red-900/20 dark:ring-red-400/30 bg-red-50/30 dark:bg-red-950/20',
        (href || onClick) &&
            'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:focus-visible:ring-red-400',
        className
    );

    const content = (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                    {value}
                </p>
                {sublabel && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sublabel}</p>
                )}
            </div>
            {icon && (
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        ICON_TONE[tone]
                    )}
                    aria-hidden="true"
                >
                    {icon}
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className={cn('block', baseClasses)}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button type="button" onClick={onClick} aria-pressed={active} className={cn('w-full', baseClasses)}>
                {content}
            </button>
        );
    }

    return <div className={baseClasses}>{content}</div>;
}
