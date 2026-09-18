import React from 'react';
import Modal from '@/Components/Modal';
import { LogOut, ShieldAlert, Loader2 } from 'lucide-react';

interface SignOutDialogProps {
    show: boolean;
    isLoggingOut: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function SignOutDialog({
    show,
    isLoggingOut,
    onClose,
    onConfirm,
}: SignOutDialogProps) {
    return (
        <Modal
            show={show}
            onClose={() => !isLoggingOut && onClose()}
            maxWidth="sm"
            closeable={!isLoggingOut}
            ariaLabel="Sign Out Confirmation"
        >
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl text-left">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-slate-900 font-serif tracking-tight">
                                Sign Out Session
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Are you sure you want to end your current authenticated session in SPMO SIMS?
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-slate-600 text-xs leading-relaxed">
                        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>Your logout time and session termination will be automatically recorded in the system audit ledger.</span>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoggingOut}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 cursor-pointer transition-colors text-center"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoggingOut}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-900 hover:bg-red-950 active:bg-black focus:outline-none focus:ring-2 focus:ring-red-900/50 disabled:opacity-50 cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs"
                        >
                            {isLoggingOut ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Signing Out...</span>
                                </>
                            ) : (
                                <span>Sign Out</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

