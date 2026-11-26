import { Button } from '@/Components/ui/button';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import React from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { AlertTriangle, X } from 'lucide-react';
import { Role } from '../types';

interface DeleteRoleDialogProps {
    isOpen: boolean;
    role: Role | null;
    onClose: () => void;
}

export default function DeleteRoleDialog({
    isOpen,
    role,
    onClose,
}: DeleteRoleDialogProps) {
    const { delete: destroy, processing } = useForm({});

    const handleDelete = () => {
        if (!role) return;

        destroy(route('access-control.role-permission.destroy', role.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    if (!role) return null;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md" closeable={!processing} ariaLabel="Delete Role Confirmation">
            <div className="h-1.5 w-full bg-red-600 shrink-0" />

            <DialogHeader className="items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-slate-900 dark:text-slate-100">
                            Delete System Role
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                            Permanent role decommission confirmation
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="shrink-0"
                    aria-label="Close dialog"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            <DialogBody className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
                <p className="leading-relaxed">
                    Are you sure you want to delete the role{' '}
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold tabular-nums bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {role.name}
                    </strong>
                    ?
                </p>
                <div className="p-3.5 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-red-900 dark:text-red-300 text-sm leading-relaxed">
                    Staff accounts currently assigned to this role will lose all operational permissions granted by it. This action cannot be undone.
                </div>
            </DialogBody>

            <DialogFooter className="flex-col-reverse sm:flex-row">
                <Button variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>
                <Button variant="danger"
                    type="button"
                    onClick={handleDelete}
                    loading={processing}
                    className="w-full sm:w-auto"
                >
                    {processing ? 'Deleting...' : 'Delete Role'}
                </Button>
            </DialogFooter>
        </Modal>
    );
}
