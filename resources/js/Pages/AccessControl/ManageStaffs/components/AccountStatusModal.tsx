import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, UserCheck, X } from 'lucide-react';
import { Staff } from '../types';

interface AccountStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    isProcessing: boolean;
    onConfirm: () => void;
}

export default function AccountStatusModal({
    isOpen,
    onClose,
    staff,
    isProcessing,
    onConfirm,
}: AccountStatusModalProps) {
    if (!staff) return null;

    const isActive = staff.status === 'Active';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="overflow-hidden rounded-xl bg-white shadow-xl">
                {/* Status Color Bar */}
                <div
                    className={`h-1.5 w-full shrink-0 ${
                        isActive ? 'bg-red-800' : 'bg-emerald-700'
                    }`}
                ></div>

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                    isActive
                                        ? 'bg-red-50 text-red-900 border-red-100/80'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                }`}
                            >
                                {isActive ? (
                                    <AlertTriangle className="w-5 h-5 text-red-700" />
                                ) : (
                                    <UserCheck className="w-5 h-5 text-emerald-700" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    {isActive ? 'Disable Staff Account' : 'Enable Staff Account'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Administrative access authorization update
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 space-y-3">
                        <p className="leading-relaxed">
                            Are you sure you want to {isActive ? 'disable' : 'enable'} access credentials for{' '}
                            <strong className="text-gray-900 font-semibold">{staff.name}</strong>{' '}
                            <span className="font-mono text-gray-500 text-[11px]">({staff.email})</span>?
                        </p>
                        <div
                            className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                                isActive
                                    ? 'bg-red-50/60 border-red-200/80 text-red-900'
                                    : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                            }`}
                        >
                            {isActive
                                ? 'Disabling this account immediately revokes university system privileges. Active user sessions will be invalidated and future authentication attempts blocked until re-enabled by an administrator.'
                                : 'Enabling this account restores university portal access and reinstates administrative authority according to their assigned role.'}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`px-5 py-2.5 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer ${
                                isActive
                                    ? 'bg-red-950 hover:bg-red-900 active:bg-red-950'
                                    : 'bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>{isActive ? 'Disable Account' : 'Enable Account'}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
