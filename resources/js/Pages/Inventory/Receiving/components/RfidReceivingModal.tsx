import React from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { InventoryItem } from '../types';
import { Radio, X, Loader2 } from 'lucide-react';

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
        <Modal show={show} onClose={onClose} maxWidth="md" ariaLabel="Scan RFID Tag">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Institutional Maroon Accent Line */}
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 w-full shrink-0" />

                {/* Header */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-950 flex items-center justify-center border border-red-100/80 shadow-2xs shrink-0">
                            <Radio className="w-5 h-5 text-red-900" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                Scan RFID Tag
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                Identify inventory item via hardware scanner or tag entry.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Scanner Input field */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
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
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors shadow-2xs"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-2.5">
                                    <Loader2 className="animate-spin h-4 w-4 text-red-900" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Use a handheld scanner or type the RFID identifier and press Enter.
                        </p>
                    </div>

                    {/* TAG IDENTIFIED CARD */}
                    {matchedItem && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                    Tag Identified
                                </span>
                                {matchedItem.rfid_tag && (
                                    <span className="font-mono text-xs text-emerald-900 font-semibold bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                                        {matchedItem.rfid_tag}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 font-serif">
                                {matchedItem.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1 border-t border-emerald-100">
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">SKU / Code</span>
                                    <span className="font-mono font-medium text-gray-800">{matchedItem.sku || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Current Stock</span>
                                    <span className="font-mono font-semibold text-gray-900">{matchedItem.stock ?? 0} {matchedItem.unit_of_issue || 'pcs'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERROR / NOT FOUND CARD */}
                    {errorMessage && !matchedItem && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                                <span>Tag Not Registered</span>
                            </div>
                            <p className="text-xs text-red-700 leading-relaxed">
                                {errorMessage}
                            </p>
                            <button
                                type="button"
                                onClick={() => router.visit(route('rfid-scanner.index'))}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-900 hover:bg-red-950 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                                Go to RFID Tagging →
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => matchedItem && onConfirmReceive(matchedItem)}
                        disabled={!matchedItem}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-950 rounded-lg shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center"
                    >
                        Continue to Receiving Form
                    </button>
                </div>
            </div>
        </Modal>
    );
};
