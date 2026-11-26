import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import React from 'react';
import Modal from '@/Components/Modal';
import { LogOut, ShieldAlert } from 'lucide-react';

interface SignOutDialogProps {
    show: boolean;
    isLoggingOut: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function SignOutDialog({
    show,
    isLoggingOut,
    onClose,
    onConfirm,
}: SignOutDialogProps) {
    return (
        <Modal
            show={show}
            onClose={() => !isLoggingOut && onClose()}
            maxWidth="sm"
            closeable={!isLoggingOut}
            ariaLabel="Sign Out Confirmation"
        >
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

            <DialogHeader>
                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/50 flex items-center justify-center shrink-0">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-slate-900 dark:text-slate-100">
                            Sign Out Session
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Are you sure you want to end your current authenticated session in SupplySync?
                        </p>
                    </div>
                </div>
            </DialogHeader>

            <DialogBody>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <span>Your logout time and session termination will be automatically recorded in the system audit ledger.</span>
                </div>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row">
                <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isLoggingOut}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>

                <Button variant="primary"
                    type="button"
                    onClick={onConfirm}
                    loading={isLoggingOut}
                    className="w-full sm:w-auto"
                >
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
