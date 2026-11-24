import { DialogHeader } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
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
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-none">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                {/* Header */}
                <DialogHeader className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-sans tracking-tight truncate">
                                Create Role
                            </h3>
                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1 truncate">
                                Register a new institutional access role.
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
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                            <label
                                htmlFor="create-role-name"
                                className="block mb-1.5 text-sm font-semibold normal-case tracking-normal text-gray-700 dark:text-slate-300"
                            >
                                Role Name <span className="text-red-600 dark:text-red-400">*</span>
                            </label>
                            <input aria-invalid={Boolean(errors.name)}
                                type="text"
                                id="create-role-name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    if (errors.name) clearErrors('name');
                                }}
                                disabled={processing}
                                className={"ui-field " + (`bg-white dark:bg-slate-800 border text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 focus:outline-none block w-full p-2.5 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm ${errors.name ? "border-red-500" : "border-gray-300 dark:border-slate-700"}`)}
                                placeholder="e.g. Property Custodian or Internal Auditor"
                                required
                                autoFocus
                            />
                            {errors.name ? (
                                <p className="leading-relaxed text-sm text-red-600 dark:text-red-400 mt-1.5 font-medium">
                                    {errors.name}
                                </p>
                            ) : (
                                <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1.5">
                                    Use a clear, descriptive title representing operational authority.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 gap-2.5">
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto text-center"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
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
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
