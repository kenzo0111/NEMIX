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
            <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                {/* Status Color Bar */}
                <div
                    className={`h-1 w-full shrink-0 ${
                        isActive ? 'bg-red-700' : 'bg-emerald-700'
                    }`}
                ></div>

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    isActive
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}
                            >
                                {isActive ? (
                                    <AlertTriangle className="w-5 h-5" />
                                ) : (
                                    <UserCheck className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    {isActive ? 'Disable Staff Account' : 'Enable Staff Account'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Administrative status change confirmation
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 space-y-2">
                        <p>
                            Are you sure you want to {isActive ? 'disable' : 'enable'} access for{' '}
                            <strong className="text-gray-900 font-semibold">{staff.name}</strong>{' '}
                            <span className="font-mono text-gray-500">({staff.email})</span>?
                        </p>
                        <div
                            className={`p-3 rounded-md border text-xs leading-relaxed ${
                                isActive
                                    ? 'bg-red-50/70 border-red-200 text-red-900'
                                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            }`}
                        >
                            {isActive
                                ? 'Disabling this account will immediately revoke all administrative privileges. Active sessions will be terminated and login attempts will be rejected until access is re-enabled by an administrator.'
                                : 'Enabling this account will restore system login availability and reinstate administrative access according to their assigned role.'}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-md shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                isActive
                                    ? 'bg-red-700 hover:bg-red-800 active:bg-red-900 border border-red-800'
                                    : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-800'
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
