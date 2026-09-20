import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { Signatory } from '../types';

interface AddSignatoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialName?: string;
    onSuccess: (signatory: Signatory) => void;
}

export default function AddSignatoryDialog({
    isOpen,
    onClose,
    initialName = '',
    onSuccess,
}: AddSignatoryDialogProps) {
    const [name, setName] = useState<string>('');
    const [designation, setDesignation] = useState<string>('');
    const [office, setOffice] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setDesignation('');
            setOffice('');
            setErrorMessage(null);
            setSubmitting(false);
        }
    }, [isOpen, initialName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Full Name is required.');
            return;
        }

        if (!designation.trim()) {
            setErrorMessage('Official Designation / Title is required.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.post<{
                message: string;
                signatory: Signatory;
            }>(route('admin.signatories.store'), {
                name: name.trim(),
                designation: designation.trim(),
                office: office.trim() || null,
                is_active: true,
            });

            if (response.data && response.data.signatory) {
                onSuccess(response.data.signatory);
                onClose();
            }
        } catch (error: any) {
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.errors) {
                    const firstErr = Object.values(data.errors).flat()[0];
                    setErrorMessage(String(firstErr));
                } else if (data.message) {
                    setErrorMessage(data.message);
                } else {
                    setErrorMessage('Failed to create signatory. Please check your inputs.');
                }
            } else {
                setErrorMessage('Network error occurred. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            show={isOpen}
            onClose={() => !submitting && onClose()}
            maxWidth="md"
            closeable={!submitting}
            ariaLabel="Add New Signatory"
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-400 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight truncate">
                                Add New Signatory
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                                Register authorized personnel to the official directory.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        {errorMessage && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={submitting}
                                placeholder="e.g. JUAN DELA CRUZ, PhD"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                                Official Designation / Title <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                disabled={submitting}
                                placeholder="e.g. SUPPLY OFFICER III / ADMIN OFFICER V"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                                Office / Department <span className="text-gray-400 dark:text-slate-500 text-[11px] font-normal normal-case">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={office}
                                onChange={(e) => setOffice(e.target.value)}
                                disabled={submitting}
                                placeholder="e.g. Supply & Property Management Office (SPMO)"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 dark:bg-slate-850/80 border-t border-gray-200 dark:border-slate-800 gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !name.trim() || !designation.trim()}
                            className="w-full sm:w-auto px-5 py-2.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Adding...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Add Signatory</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
