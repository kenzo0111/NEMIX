import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, UserCheck, X } from 'lucide-react';
import { Staff } from '../types';

interface AccountStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    isProcessing: boolean;
    onConfirm: () => void;
}

export default function AccountStatusModal({
    isOpen,
    onClose,
    staff,
    isProcessing,
    onConfirm,
}: AccountStatusModalProps) {
    if (!staff) return null;

    const isActive = staff.status === 'Active';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md" closeable={!isProcessing} ariaLabel="Staff Account Status Confirmation">
            <div className={`h-1.5 w-full shrink-0 ${isActive ? 'bg-red-800' : 'bg-emerald-700'}`} />

            <DialogHeader className="items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isActive
                            ? 'bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border-red-100/80 dark:border-red-900/40'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'}`}
                    >
                        {isActive ? (
                            <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" />
                        ) : (
                            <UserCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-slate-900 dark:text-slate-100 truncate">
                            {isActive ? 'Disable Staff Account' : 'Enable Staff Account'}
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Administrative access authorization update
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="shrink-0"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            <DialogBody className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
                <p className="leading-relaxed">
                    Are you sure you want to {isActive ? 'disable' : 'enable'} access credentials for{' '}
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{staff.name}</strong>{' '}
                    <span className="tabular-nums text-slate-500 dark:text-slate-400 text-sm">({staff.email})</span>?
                </p>
                <div
                    className={`p-3.5 rounded-lg border text-sm leading-relaxed ${isActive
                        ? 'bg-red-50/60 dark:bg-red-950/40 border-red-200/80 dark:border-red-900/50 text-red-900 dark:text-red-300'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'}`}
                >
                    {isActive
                        ? 'Disabling this account immediately revokes university system privileges. Active user sessions will be invalidated and future authentication attempts blocked until re-enabled by an administrator.'
                        : 'Enabling this account restores university portal access and reinstates administrative authority according to their assigned role.'}
                </div>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row">
                <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>
                <Button variant={isActive ? 'danger' : 'primary'}
                    type="button"
                    onClick={onConfirm}
                    loading={isProcessing}
                    className="w-full sm:w-auto tabular-nums"
                >
                    {isProcessing ? 'Processing...' : isActive ? 'Disable Account' : 'Enable Account'}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
