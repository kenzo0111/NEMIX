import React from 'react';
import Modal from '@/Components/Modal';

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
        >
            <div className="bg-white rounded-xl shadow-xl w-full overflow-hidden border border-slate-200 text-left p-6 select-none">
                <h3 className="text-base font-bold text-slate-900 font-serif tracking-tight">
                    Sign Out
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Are you sure you want to sign out of the Supply and Property Management System?
                </p>

                <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    Your logout time will be recorded in the audit log.
                </p>

                <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoggingOut}
                        className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoggingOut}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-900 hover:bg-red-950 active:bg-black focus:outline-none focus:ring-2 focus:ring-red-900/50 disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-2"
                    >
                        {isLoggingOut ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    />
                                </svg>
                                <span>Signing Out...</span>
                            </>
                        ) : (
                            <span>Sign Out</span>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
