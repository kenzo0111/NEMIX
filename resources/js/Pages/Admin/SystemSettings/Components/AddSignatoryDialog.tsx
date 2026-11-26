import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
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
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

            {/* Header */}
            <DialogHeader className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-400 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0 shadow-sm">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            Add New Signatory
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                            Register authorized personnel to the official directory.
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="shrink-0 ml-2"
                    aria-label="Close dialog"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <DialogBody className="p-4 sm:p-6 space-y-4">
                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 dark:text-red-300" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <Field id="signatory-name" label="Full Name" required>
                        <input
                            type="text"
                            id="signatory-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. JUAN DELA CRUZ, PhD"
                            className="ui-field w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800"
                            autoFocus
                            required
                        />
                    </Field>

                    <Field id="signatory-designation" label="Official Designation / Title" required>
                        <input
                            type="text"
                            id="signatory-designation"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. SUPPLY OFFICER III / ADMIN OFFICER V"
                            className="ui-field w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800"
                            required
                        />
                    </Field>

                    <Field id="signatory-office" label={<>Office / Department <span className="text-slate-500 dark:text-slate-400 text-sm font-normal normal-case">(Optional)</span></>}>
                        <input
                            type="text"
                            id="signatory-office"
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            disabled={submitting}
                            placeholder="e.g. Supply & Property Management Office (SPMO)"
                            className="ui-field w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800"
                        />
                    </Field>
                </DialogBody>

                {/* Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-slate-850/80 border-t border-slate-200 dark:border-slate-800 gap-2.5">
                    <Button variant="secondary"
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-full sm:w-auto text-center"
                    >
                        Cancel
                    </Button>
                    <Button variant="primary"
                        type="submit"
                        disabled={submitting || !name.trim() || !designation.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
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
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    );
}
