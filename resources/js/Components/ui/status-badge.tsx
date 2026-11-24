import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export default function StatusBadge({ children, tone = 'neutral', className }: {
    children: ReactNode; tone?: StatusTone; className?: string;
}) {
    return <span className={cn('ui-status', className)} data-tone={tone}>
        <span className="ui-status-dot" aria-hidden="true" />{children}
    </span>;
}
