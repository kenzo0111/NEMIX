import React, { useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
import { InventoryItem, Supplier } from '../types';
import { Loader2, Radio, X } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    scanInput: string;
    onScanInputChange: (value: string) => void;
    onScanLookup: (value: string) => void;
    scannedItems: InventoryItem[];
    onRemove: (tag: string) => void;
    suppliers: Supplier[];
    supplierIds: Record<string, number | ''>;
    onSupplierChange: (tag: string, supplierId: number | '') => void;
    dateReceived: string;
    onDateChange: (value: string) => void;
    isSearching: boolean;
    processing: boolean;
    errorMessage: string | null;
    submitError: string | null;
    onSubmit: () => void;
}

export const RfidReceivingModal: React.FC<Props> = ({ show, onClose, scanInput, onScanInputChange, onScanLookup, scannedItems, onRemove, suppliers, supplierIds, onSupplierChange, dateReceived, onDateChange, isSearching, processing, errorMessage, submitError, onSubmit }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (show && !isSearching) inputRef.current?.focus(); }, [show, isSearching, scannedItems.length]);
    const ready = scannedItems.length > 0 && scannedItems.every(item => Boolean(supplierIds[item.rfid_tag || ''])) && Boolean(dateReceived);

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg" ariaLabel="Scan RFID Tags">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950" />
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3"><Radio className="w-5 h-5 text-red-900" /><div><h3 className="text-base font-bold font-serif">Scan RFID</h3><p className="text-xs text-gray-500">Scan each tagged item, then review and receive them together.</p></div></div>
                    <button type="button" onClick={onClose} disabled={processing} aria-label="Close modal" className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-40"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <form onSubmit={event => { event.preventDefault(); if (!processing) onScanLookup(scanInput); }}>
                        <label htmlFor="rfid-receiving-input" className="block text-xs font-semibold mb-1">RFID tag</label>
                        <div className="flex gap-2"><input ref={inputRef} id="rfid-receiving-input" data-rfid-input="true" value={scanInput} onChange={event => onScanInputChange(event.target.value)} placeholder="Scan or type a tag, then press Enter" disabled={processing} className="flex-1 min-w-0 rounded-lg border-gray-300 text-sm font-mono" /><button type="submit" disabled={processing || !scanInput.trim()} className="px-4 py-2 rounded-lg bg-red-900 text-white text-xs font-semibold disabled:opacity-40">Add tag</button></div>
                    </form>
                    {isSearching && <p className="text-xs text-gray-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Looking up tag...</p>}
                    {errorMessage && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">{errorMessage}</p>}
                    {submitError && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">{submitError}</p>}
                    <div className="flex items-center justify-between"><h4 className="text-sm font-bold">Scanned items ({scannedItems.length})</h4><span className="text-xs text-gray-500">One unit per tag</span></div>
                    {scannedItems.length === 0 ? <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-5 text-center">No tags scanned yet.</p> : (
                        <div className="space-y-2">{scannedItems.map(item => {
                            const tag = item.rfid_tag || '';
                            return <div key={tag} className="p-3 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{item.name}</p><p className="text-xs text-gray-600 font-mono">{tag} · {item.sku || 'No SKU'} · Stock: {item.stock ?? 0}</p></div>
                                <label className="text-xs text-gray-700">Supplier <select value={supplierIds[tag] ?? ''} onChange={event => onSupplierChange(tag, event.target.value ? Number(event.target.value) : '')} disabled={processing} className="block mt-1 rounded-md border-gray-300 text-xs w-full sm:w-44"><option value="">Select supplier</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
                                <button type="button" onClick={() => onRemove(tag)} disabled={processing} aria-label={`Remove ${tag}`} className="text-xs text-red-800 hover:underline disabled:opacity-40">Remove</button>
                            </div>;
                        })}</div>
                    )}
                    <label className="block text-xs font-semibold">Date received <input type="date" value={dateReceived} onChange={event => onDateChange(event.target.value)} disabled={processing} className="block mt-1 rounded-md border-gray-300 text-sm" /></label>
                </div>
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={processing} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold">Cancel</button><button type="button" onClick={onSubmit} disabled={!ready || isSearching || processing} className="px-4 py-2 rounded-lg bg-red-900 text-white text-xs font-semibold disabled:opacity-40">{processing ? 'Receiving...' : `Receive ${scannedItems.length} item${scannedItems.length === 1 ? '' : 's'}`}</button></div>
            </div>
        </Modal>
    );
};
