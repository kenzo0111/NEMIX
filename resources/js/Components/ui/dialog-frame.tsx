import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} data-dialog-part="header" className={cn('ui-dialog-header shrink-0', className)} />;
}
export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} data-dialog-part="body" className={cn('ui-dialog-body flex-1 min-h-0 overflow-y-auto', className)} />;
}
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} data-dialog-part="footer" className={cn('ui-dialog-footer shrink-0', className)} />;
}
