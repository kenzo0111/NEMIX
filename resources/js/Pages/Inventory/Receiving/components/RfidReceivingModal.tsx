import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { InventoryItem } from '../types';

interface RfidReceivingModalProps {
    show: boolean;
    onClose: () => void;
    scanInput: string;
    onScanInputChange: (value: string) => void;
    onScanLookup: (value: string) => void;
    matchedItem: InventoryItem | null;
    isSearching: boolean;
    errorMessage: string | null;
    onConfirmReceive: (item: InventoryItem) => void;
}

export const RfidReceivingModal: React.FC<RfidReceivingModalProps> = ({
    show,
    onClose,
    scanInput,
    onScanInputChange,
    onScanLookup,
    matchedItem,
    isSearching,
    errorMessage,
    onConfirmReceive,
}) => {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Thin Maroon Accent Line */}
                <div className="h-1 bg-red-900 w-full" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Scan RFID Tag
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Identify inventory item via hardware scanner or tag entry.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Scanner Input field */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            RFID Tag ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                data-rfid-input="true"
                                value={scanInput}
                                onChange={(e) => {
                                    onScanInputChange(e.target.value);
                                    onScanLookup(e.target.value);
                                }}
                                placeholder="Waiting for scanner input or enter tag ID..."
                                autoFocus
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono focus:bg-white focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-2.5">
                                    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                            Use a handheld scanner or type the RFID identifier and press Enter.
                        </p>
                    </div>

                    {/* TAG IDENTIFIED CARD */}
                    {matchedItem && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                    Tag Identified
                                </span>
                                <span className="text-xs font-mono text-gray-600 font-semibold">
                                    RFID: {matchedItem.rfid_tag || scanInput}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">{matchedItem.name}</h4>
                            <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                                <div>
                                    <dt className="text-gray-500 text-[11px]">SKU / Property No</dt>
                                    <dd className="font-semibold text-gray-800 font-mono mt-0.5">
                                        {matchedItem.sku || 'N/A'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 text-[11px]">Supplier</dt>
                                    <dd className="font-medium text-gray-800 mt-0.5">
                                        {matchedItem.supplier_name || 'None associated'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    {/* NOT REGISTERED ERROR */}
                    {errorMessage && !matchedItem && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <span>RFID Tag Not Registered</span>
                            </div>
                            <p className="text-gray-700">
                                {errorMessage} Please register this RFID tag in the RFID Tagging Console first.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.visit(route('rfid-scanner.index'))}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-900 hover:bg-red-950 text-white font-medium rounded text-xs transition-colors"
                            >
                                Go to RFID Tagging →
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => matchedItem && onConfirmReceive(matchedItem)}
                        disabled={!matchedItem}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-950 rounded-md shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Continue to Receiving Form
                    </button>
                </div>
            </div>
        </Modal>
    );
};
