import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { Button } from './button';
import { DialogHeader, DialogBody, DialogFooter } from './dialog-frame';

export interface ConfirmDialogProps {
    show: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
    show,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    return (
        <Modal show={show} onClose={loading ? () => {} : onClose} maxWidth="md" ariaLabel={title}>
            <DialogHeader>
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className={
                            variant === 'danger'
                                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        }
                    >
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="min-w-0 pt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {title}
                    </h2>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    disabled={loading}
                    aria-label={`Close ${title}`}
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </Button>
            </DialogHeader>
            <DialogBody>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {message}
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button variant={variant} onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
