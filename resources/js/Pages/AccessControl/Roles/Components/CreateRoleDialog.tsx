import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { X } from 'lucide-react';
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
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Create Role
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Register a new administrative access role for the university.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label
                                htmlFor="create-role-name"
                                className="block mb-1.5 text-xs font-semibold text-gray-700"
                            >
                                Role Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                id="create-role-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`bg-white border text-gray-900 text-xs rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all placeholder:text-gray-400 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g. Property Custodian or Internal Auditor"
                                required
                                autoFocus
                            />
                            {errors.name ? (
                                <p className="text-[11px] text-red-600 mt-1 font-medium">
                                    {errors.name}
                                </p>
                            ) : (
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                    Use a clear name describing the role's institutional responsibility.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-200 gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="px-4 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {processing ? 'Creating...' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
