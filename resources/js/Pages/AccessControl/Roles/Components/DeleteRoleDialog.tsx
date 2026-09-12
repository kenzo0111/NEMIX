import React from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';
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
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-xl overflow-hidden p-4 sm:p-6">
                <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200/80 shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Delete Role
                        </h3>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                            Are you sure you want to delete{' '}
                            <strong className="text-gray-900 font-semibold">"{role.name}"</strong>?
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Staff accounts assigned to this role may lose the capabilities granted
                            through this role. This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
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
                        className="w-full sm:w-auto px-4 py-2 bg-red-900 hover:bg-red-950 active:bg-red-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                    >
                        {processing ? 'Deleting...' : 'Delete Role'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
