import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { X, ShieldPlus, Loader2 } from 'lucide-react';
import { CreateRoleFormData } from '../types';

interface CreateRoleDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateRoleDialog({ isOpen, onClose }: CreateRoleDialogProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<CreateRoleFormData>({
            name: '',
        });

    useEffect(() => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
    }, [isOpen, reset, clearErrors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.name.trim()) return;

        post(route('access-control.role-permission.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md" closeable={!processing} ariaLabel="Create New Role">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <ShieldPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                Create Role
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                Register a new institutional access role.
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                            <label
                                htmlFor="create-role-name"
                                className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700"
                            >
                                Role Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                id="create-role-name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    if (errors.name) clearErrors('name');
                                }}
                                disabled={processing}
                                className={`bg-white border text-gray-900 text-sm rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 focus:outline-none block w-full p-2.5 transition-all placeholder:text-gray-400 shadow-2xs ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g. Property Custodian or Internal Auditor"
                                required
                                autoFocus
                            />
                            {errors.name ? (
                                <p className="text-xs text-red-600 mt-1.5 font-medium">
                                    {errors.name}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Use a clear, descriptive title representing operational authority.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 border-t border-gray-200 gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="w-full sm:w-auto px-5 py-2.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldPlus className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Create Role</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
