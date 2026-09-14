import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Full Name is required.');
            return;
        }

        if (!designation.trim()) {
            setErrorMessage('Designation is required.');
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-red-950 to-red-900 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-tight">Add New Signatory</h3>
                            <p className="text-[11px] text-red-200/90">
                                Register authorized personnel to official directory
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1 rounded-lg text-red-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. JUAN DELA CRUZ"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300 disabled:bg-slate-50"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Official Designation / Title <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. SUPPLY OFFICER III / ADMIN OFFICER V"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300 disabled:bg-slate-50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Office / Department <span className="text-slate-400 text-[11px] font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. Supply & Property Management Office (SPMO)"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300 disabled:bg-slate-50"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !name.trim() || !designation.trim()}
                            className="px-4 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-800 active:bg-red-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{submitting ? 'Adding...' : 'Add Signatory'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
