import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
            <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                aria-hidden="true"
            >
                {icon ?? <Inbox className="h-6 w-6" />}
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            {description && (
                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
            )}
            {(action || (actionLabel && onAction)) && (
                <div className="mt-4">
                    {action ?? (
                        <Button variant="secondary" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
