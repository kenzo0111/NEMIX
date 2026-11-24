import { Button } from '@/Components/ui/button';
import React from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { AlertTriangle, Loader2, X } from 'lucide-react';
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
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-none">
                {/* Red Destructive Accent Line */}
                <div className="h-1.5 w-full bg-red-600 shrink-0" />

                <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 flex items-center justify-center shrink-0 shadow-sm">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-sans tracking-tight truncate">
                                    Delete System Role
                                </h3>
                                <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1 truncate">
                                    Permanent role decommission confirmation
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon"
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="shrink-0 ml-2"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="mt-4 text-sm text-gray-600 dark:text-slate-300 space-y-3">
                        <p className="leading-relaxed">
                            Are you sure you want to delete the role{' '}
                            <strong className="text-gray-900 dark:text-slate-100 font-semibold tabular-nums bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                                {role.name}
                            </strong>
                            ?
                        </p>
                        <div className="p-3.5 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-red-900 dark:text-red-300 text-sm leading-relaxed">
                            Staff accounts currently assigned to this role will lose all operational permissions granted by it. This action cannot be undone.
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto text-center"
                        >
                            Cancel
                        </Button>
                        <Button variant="danger"
                            type="button"
                            onClick={handleDelete}
                            disabled={processing}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-center"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <span>Delete Role</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
