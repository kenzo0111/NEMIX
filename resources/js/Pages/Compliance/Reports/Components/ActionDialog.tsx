import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ActionDialogProps {
    show: boolean;
    type: 'success' | 'confirm' | 'error';
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
}

export const ActionDialog: React.FC<ActionDialogProps> = ({
    show,
    type,
    title,
    message,
    onClose,
    onConfirm,
}) => {
    const accentBg =
        type === 'success'
            ? 'bg-emerald-600'
            : type === 'confirm'
            ? 'bg-amber-600'
            : 'bg-red-700';

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm" ariaLabel={title}>
            <div className={`h-1.5 w-full shrink-0 ${accentBg}`} />

            <DialogBody className="text-center flex flex-col items-center">
                {type === 'success' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-800/50 mb-3.5 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-6 w-6" />
                    </div>
                )}
                {type === 'confirm' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/80 dark:border-amber-800/50 mb-3.5 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                )}
                {type === 'error' && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100/80 dark:border-red-800/50 mb-3.5 text-red-600 dark:text-red-400">
                        <X className="h-6 w-6" />
                    </div>
                )}

                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{message}</p>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row justify-center">
                {type === 'confirm' ? (
                    <>
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            className="w-full sm:flex-1"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="button"
                            onClick={onConfirm}
                            className="w-full sm:flex-1"
                        >
                            Confirm
                        </Button>
                    </>
                ) : (
                    <Button variant="primary"
                        type="button"
                        onClick={onClose}
                        className="w-full"
                    >
                        Close
                    </Button>
                )}
            </DialogFooter>
        </Modal>
    );
};
