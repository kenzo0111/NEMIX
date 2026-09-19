import React, { useEffect, useMemo, useRef } from 'react';
import Modal from '@/Components/Modal';
import { InventoryItem, RfidDeviceOption, Supplier } from '../types';
import { AlertCircle, CheckCircle2, Info, Loader2, Radio, Server, X } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    scanInput: string;
    onScanInputChange: (value: string) => void;
    onScanLookup: (value: string) => void;
    scannedItems: InventoryItem[];
    queuedItems?: InventoryItem[];
    onRemove: (tag: string) => void;
    suppliers: Supplier[];
    supplierIds: Record<string, number | ''>;
    costs: Record<string, string>;
    onCostChange: (tag: string, cost: string) => void;
    connectionState: 'connecting' | 'connected' | 'offline';
    scanFeedback: string;
    onSupplierChange: (tag: string, supplierId: number | '') => void;
    dateReceived: string;
    onDateChange: (value: string) => void;
    isSearching: boolean;
    processing: boolean;
    errorMessage: string | null;
    submitError: string | null;
    onSubmit: () => void;
    devices?: RfidDeviceOption[];
    selectedDeviceUuid?: string;
    onDeviceChange?: (deviceUuid: string) => void;
    selectedStation?: string;
    onStationChange?: (station: string) => void;
}

const validateCost = (cost?: string): string | null => {
    if (cost === undefined || cost === '') return 'Unit cost is required.';
    const num = Number(cost);
    if (!Number.isFinite(num) || num < 0) return 'Cost must be a positive number or 0.00.';
    if (num > 9999999999.99) return 'Cost exceeds maximum limit.';
    if (!/^\d+(\.\d{1,2})?$/.test(cost)) return 'Max 2 decimal places (e.g. 15.50).';
    return null;
};

export const RfidReceivingModal: React.FC<Props> = ({
    show,
    onClose,
    scanInput,
    onScanInputChange,
    onScanLookup,
    scannedItems,
    queuedItems = [],
    onRemove,
    suppliers,
    supplierIds,
    costs,
    onCostChange,
    connectionState,
    scanFeedback,
    onSupplierChange,
    dateReceived,
    onDateChange,
    isSearching,
    processing,
    errorMessage,
    submitError,
    onSubmit,
    devices = [],
    selectedDeviceUuid = '',
    onDeviceChange,
    selectedStation = '',
    onStationChange,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (show) {
            inputRef.current?.focus();
        }
    }, [show]);

    // Active vs Inactive suppliers partition
    const eligibleSuppliers = useMemo(() => {
        return suppliers.filter(s => !s.status || s.status === 'active');
    }, [suppliers]);

    const is100LimitReached = scannedItems.length >= 100;

    // Row-level validation state for each scanned item
    const rowErrors = useMemo(() => {
        const errors: Record<string, { cost?: string; supplier?: string }> = {};
        for (const item of scannedItems) {
            const tag = item.rfid_tag || '';
            const cost = costs[tag];
            const supplierId = supplierIds[tag];

            const costError = validateCost(cost);
            let supplierError: string | undefined;

            if (!supplierId) {
                supplierError = 'Supplier required.';
            } else {
                const found = suppliers.find(s => s.id === Number(supplierId));
                if (found?.status && found.status !== 'active') {
                    supplierError = 'Supplier is inactive.';
                }
            }

            if (costError || supplierError) {
                errors[tag] = {
                    cost: costError || undefined,
                    supplier: supplierError,
                };
            }
        }
        return errors;
    }, [scannedItems, costs, supplierIds, suppliers]);

    const hasRowErrors = Object.keys(rowErrors).length > 0;
    const ready =
        scannedItems.length > 0 &&
        scannedItems.length <= 100 &&
        !hasRowErrors &&
        Boolean(dateReceived) &&
        !processing;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Scan RFID Tags">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Institutional Top Accent */}
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-950 flex items-center justify-center border border-red-200">
                            <Radio className="w-5 h-5 text-red-900" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 font-serif">Scan RFID Receiving</h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    is100LimitReached
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-red-50 text-red-900 border border-red-200'
                                }`}>
                                    {scannedItems.length} / 100 Items
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Each tag identifies an item type (1 unit per tag receipt). Scans are isolated to your assigned station.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Close modal"
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Device & Station Scoping Bar */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <Server className="w-4 h-4 text-slate-600 shrink-0" />
                            <span className="font-semibold text-slate-700">Station Hardware:</span>
                            {devices && devices.length > 0 && onDeviceChange ? (
                                <select
                                    value={selectedDeviceUuid}
                                    onChange={e => onDeviceChange(e.target.value)}
                                    disabled={processing}
                                    aria-label="Hardware Device"
                                    className="rounded-lg border-gray-300 text-xs py-1 px-2.5 bg-white text-gray-800 font-mono focus:ring-1 focus:ring-red-900"
                                >
                                    <option value="">All Scanners (Default)</option>
                                    {devices.map(dev => (
                                        <option key={dev.device_uuid} value={dev.device_uuid}>
                                            {dev.device_name} ({dev.device_uuid}) - {dev.status}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {selectedDeviceUuid || 'Station Default Reader'}
                                </span>
                            )}
                            {onStationChange && (
                                <input
                                    type="text"
                                    placeholder="Station ID"
                                    value={selectedStation}
                                    onChange={e => onStationChange(e.target.value)}
                                    disabled={processing}
                                    title="Receiving Station Identifier"
                                    className="w-24 rounded-lg border-gray-300 text-xs py-1 px-2 bg-white text-gray-800 font-mono focus:ring-1 focus:ring-red-900"
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    connectionState === 'connected'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : connectionState === 'connecting'
                                        ? 'bg-amber-400 animate-pulse'
                                        : 'bg-red-500'
                                }`}
                            />
                            <span className="capitalize font-semibold text-slate-700">{connectionState}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 truncate max-w-xs" title={scanFeedback}>
                                {scanFeedback}
                            </span>
                        </div>
                    </div>

                    {/* Queued Scans Notice (if scans arrived during submission) */}
                    {queuedItems.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">
                                    {queuedItems.length} scan{queuedItems.length === 1 ? '' : 's'} arrived during submission.
                                </span>{' '}
                                These are safely buffered and will automatically populate a new receiving session once the current batch finishes.
                            </div>
                        </div>
                    )}

                    {/* 100-Item Batch Limit Warning */}
                    {is100LimitReached && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-900">
                            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                            <span>
                                <strong>Maximum batch limit reached (100 items).</strong> You cannot add more tags to this session. Please submit this batch to receive the stock.
                            </span>
                        </div>
                    )}

                    {/* Manual / Keyboard Scan Form */}
                    <form
                        onSubmit={event => {
                            event.preventDefault();
                            if (!processing && !is100LimitReached) {
                                onScanLookup(scanInput);
                            }
                        }}
                    >
                        <label htmlFor="rfid-receiving-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            RFID Tag Scan or Entry
                        </label>
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                id="rfid-receiving-input"
                                data-rfid-input="true"
                                value={scanInput}
                                onChange={event => onScanInputChange(event.target.value)}
                                placeholder={is100LimitReached ? 'Batch limit reached (100 items)' : 'Scan tag with hardware reader or enter tag and press Enter'}
                                disabled={processing || is100LimitReached}
                                className="flex-1 min-w-0 rounded-lg border-gray-300 text-sm font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={processing || is100LimitReached || !scanInput.trim()}
                                className="px-4 py-2 rounded-lg bg-red-900 hover:bg-red-950 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                            >
                                Add Tag
                            </button>
                        </div>
                    </form>

                    {isSearching && (
                        <p className="text-xs text-gray-600 flex items-center gap-2 py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-red-900" /> Looking up RFID tag in item registry...
                        </p>
                    )}

                    {errorMessage && (
                        <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                            {errorMessage}
                        </p>
                    )}

                    {submitError && (
                        <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                            {submitError}
                        </p>
                    )}

                    {/* Scanned Items Header */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">
                                Scanned Items ({scannedItems.length})
                            </h4>
                            <span className="text-[11px] text-gray-500">
                                1 unit received per scanned line · All items will be recorded atomically
                            </span>
                        </div>
                    </div>

                    {/* Scanned Items List */}
                    {scannedItems.length === 0 ? (
                        <div className="text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                            <Radio className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="font-semibold text-gray-700">No RFID tags scanned yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Point the station RFID reader at items, scan with a barcode wedge, or type a tag above.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {scannedItems.map((item, idx) => {
                                const tag = item.rfid_tag || '';
                                const error = rowErrors[tag];
                                const hasCostError = Boolean(error?.cost);
                                const hasSupplierError = Boolean(error?.supplier);

                                return (
                                    <div
                                        key={`${tag}-${idx}`}
                                        className={`p-3.5 border rounded-xl flex flex-col sm:flex-row sm:items-start gap-3 transition-colors ${
                                            error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        {/* Item Information */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono font-bold text-gray-400">#{idx + 1}</span>
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                            </div>
                                            <p className="text-xs text-gray-600 font-mono mt-0.5">
                                                <span className="font-semibold text-red-900 bg-red-50 px-1 py-0.5 rounded border border-red-100">
                                                    {tag}
                                                </span>{' '}
                                                · SKU: {item.sku || 'N/A'} · Current Stock: {item.stock ?? 0} {item.unit_of_issue || 'pcs'}
                                            </p>
                                        </div>

                                        {/* Supplier Dropdown */}
                                        <div className="w-full sm:w-48 shrink-0">
                                            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                                Supplier <span className="text-red-600">*</span>
                                            </label>
                                            <select
                                                value={supplierIds[tag] ?? ''}
                                                onChange={event => onSupplierChange(tag, event.target.value ? Number(event.target.value) : '')}
                                                disabled={processing}
                                                className={`block rounded-lg text-xs w-full py-1.5 px-2 bg-white ${
                                                    hasSupplierError
                                                        ? 'border-red-400 text-red-900 focus:ring-1 focus:ring-red-600'
                                                        : 'border-gray-300 text-gray-900 focus:ring-1 focus:ring-red-900'
                                                }`}
                                            >
                                                <option value="">Select supplier...</option>
                                                {/* Active eligible suppliers */}
                                                {eligibleSuppliers.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                                {/* Clearly mark inactive suppliers */}
                                                {suppliers
                                                    .filter(s => s.status && s.status !== 'active')
                                                    .map(s => (
                                                        <option key={s.id} value={s.id} disabled className="text-gray-400 bg-gray-100">
                                                            {s.name} (Inactive - Ineligible)
                                                        </option>
                                                    ))}
                                            </select>
                                            {hasSupplierError && (
                                                <p className="mt-1 text-[11px] text-red-600 font-medium">{error?.supplier}</p>
                                            )}
                                        </div>

                                        {/* Unit Cost Input with Row-level feedback */}
                                        <div className="w-full sm:w-36 shrink-0">
                                            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                                Unit Cost (₱) <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="9999999999.99"
                                                step="0.01"
                                                value={costs[tag] ?? ''}
                                                onChange={event => onCostChange(tag, event.target.value)}
                                                disabled={processing}
                                                placeholder="0.00"
                                                className={`block rounded-lg text-xs w-full py-1.5 px-2 font-mono font-medium bg-white ${
                                                    hasCostError
                                                        ? 'border-red-400 text-red-900 focus:ring-1 focus:ring-red-600'
                                                        : 'border-gray-300 text-gray-900 focus:ring-1 focus:ring-red-900'
                                                }`}
                                            />
                                            {hasCostError && (
                                                <p className="mt-1 text-[11px] text-red-600 font-medium leading-tight">{error?.cost}</p>
                                            )}
                                        </div>

                                        {/* Remove Action */}
                                        <div className="sm:pt-6 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onRemove(tag)}
                                                disabled={processing}
                                                aria-label={`Remove tag ${tag}`}
                                                className="text-xs text-red-800 hover:text-red-950 hover:underline font-semibold disabled:opacity-40 cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Date Received */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Date Received <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="date"
                            value={dateReceived}
                            onChange={event => onDateChange(event.target.value)}
                            disabled={processing}
                            className="block rounded-lg border-gray-300 text-xs py-1.5 px-3 focus:border-red-900 focus:ring-1 focus:ring-red-900"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-gray-500">
                        {scannedItems.length > 0 && !hasRowErrors && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> All {scannedItems.length} line(s) valid and ready for receipt
                            </span>
                        )}
                        {hasRowErrors && (
                            <span className="flex items-center gap-1 text-red-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" /> Resolve {Object.keys(rowErrors).length} item error(s) before receiving
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!ready || isSearching || processing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-900 hover:bg-red-950 text-white text-xs font-semibold disabled:opacity-40 shadow-xs transition-colors cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Receiving...
                                </>
                            ) : (
                                `Receive ${scannedItems.length} Item${scannedItems.length === 1 ? '' : 's'}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
