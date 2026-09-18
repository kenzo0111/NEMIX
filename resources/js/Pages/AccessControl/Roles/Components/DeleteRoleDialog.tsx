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
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                {/* Red Destructive Accent Line */}
                <div className="h-1.5 w-full bg-red-600 shrink-0" />

                <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                    Delete System Role
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    Permanent role decommission confirmation
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 space-y-3">
                        <p className="leading-relaxed">
                            Are you sure you want to delete the role{' '}
                            <strong className="text-gray-900 font-semibold font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {role.name}
                            </strong>
                            ?
                        </p>
                        <div className="p-3.5 rounded-lg bg-red-50/70 border border-red-200/80 text-red-900 text-xs leading-relaxed">
                            Staff accounts currently assigned to this role will lose all operational permissions granted by it. This action cannot be undone.
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 text-center"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <span>Delete Role</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
