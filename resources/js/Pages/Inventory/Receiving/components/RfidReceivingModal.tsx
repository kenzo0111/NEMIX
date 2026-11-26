import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import React, { useEffect, useMemo, useRef } from 'react';
import Modal from '@/Components/Modal';
import { InventoryItem, RfidDeviceOption, RfidScanNotice, Supplier } from '../types';
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
    quantities: Record<string, string>;
    onQuantityChange: (tag: string, quantity: string) => void;
    onCostChange: (tag: string, cost: string) => void;
    connectionState: 'connecting' | 'connected' | 'offline';
    scanFeedback: string;
    onSupplierChange: (tag: string, supplierId: number | '') => void;
    dateReceived: string;
    onDateChange: (value: string) => void;
    isSearching: boolean;
    processing: boolean;
    errorMessage: string | null;
    scanNotices: RfidScanNotice[];
    onDismissScanNotice: (id: string) => void;
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
    quantities,
    onQuantityChange,
    onCostChange,
    connectionState,
    scanFeedback,
    onSupplierChange,
    dateReceived,
    onDateChange,
    isSearching,
    processing,
    errorMessage,
    scanNotices,
    onDismissScanNotice,
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
        const errors: Record<string, { cost?: string; supplier?: string; quantity?: string }> = {};
        for (const item of scannedItems) {
            const tag = item.rfid_tag || '';
            const cost = costs[tag];
            const supplierId = supplierIds[tag];

            const costError = validateCost(cost);
            const quantity = quantities[tag];
            const quantityError = !quantity || !/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 1000000
                ? 'Enter the inspected quantity (1–1,000,000).'
                : undefined;
            let supplierError: string | undefined;

            if (!supplierId) {
                supplierError = 'Supplier required.';
            } else {
                const found = suppliers.find(s => s.id === Number(supplierId));
                if (found?.status && found.status !== 'active') {
                    supplierError = 'Supplier is inactive.';
                }
            }

            if (costError || supplierError || quantityError) {
                errors[tag] = {
                    cost: costError || undefined,
                    supplier: supplierError,
                    quantity: quantityError,
                };
            }
        }
        return errors;
    }, [scannedItems, costs, quantities, supplierIds, suppliers]);

    const hasRowErrors = Object.keys(rowErrors).length > 0;
    const totalQuantity = scannedItems.reduce((sum, item) => sum + (Number(quantities[item.rfid_tag || '']) || 0), 0);
    const totalCost = scannedItems.reduce((sum, item) => {
        const tag = item.rfid_tag || '';
        return sum + (Number(quantities[tag]) || 0) * (Number(costs[tag]) || 0);
    }, 0);
    const ready =
        scannedItems.length > 0 &&
        scannedItems.length <= 100 &&
        !hasRowErrors &&
        Boolean(dateReceived) &&
        !processing;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Scan RFID Tags">
            {/* Institutional Top Accent */}
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Header */}
            <DialogHeader className="shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900/50 shrink-0">
                            <Radio className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">Scan RFID Receiving</h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold ${is100LimitReached
    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-800" : "bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-900/50"}`}>
                                    {scannedItems.length} / 100 Items
                                </span>
                            </div>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 break-words mt-0.5">
                                Scan to identify each item type, then enter the inspected quantity and actual unit cost.
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Close modal"
                        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Body */}
                <DialogBody className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Device & Station Scoping Bar */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">Station Hardware</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${!selectedDeviceUuid ? "bg-amber-400" : connectionState === 'connected'
    ? "bg-emerald-500 animate-pulse" : connectionState === 'connecting'
    ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}
                                />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {selectedDeviceUuid ? `Feed ${connectionState}` : 'Ready'}
                                </span>
                                <span>·</span>
                                <span className="truncate max-w-xs" title={scanFeedback}>
                                    {scanFeedback}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex-1 min-w-0">
                                {devices && devices.length > 0 && onDeviceChange ? (
                                    <select
                                        value={selectedDeviceUuid}
                                        onChange={e => onDeviceChange(e.target.value)}
                                        disabled={processing}
                                        aria-label="Hardware Device"
                                        className="ui-field w-full rounded-lg border-slate-300 dark:border-slate-700 text-sm py-1.5 px-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums focus:ring-1 focus:ring-red-900"
                                    >
                                        <option value="">Select a scanner for hardware input</option>
                                        {devices.map(dev => (
                                            <option key={dev.device_uuid} value={dev.device_uuid}>
                                                {dev.device_name} ({dev.device_uuid}) - {dev.status}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="block w-full tabular-nums text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                                        {selectedDeviceUuid || 'Select a scanner for hardware input'}
                                    </span>
                                )}
                            </div>
                            {onStationChange && (
                                <div className="w-full sm:w-36 shrink-0">
                                    <input
                                        type="text"
                                        placeholder="Station ID"
                                        value={selectedStation}
                                        onChange={e => onStationChange(e.target.value)}
                                        disabled={processing}
                                        title="Match the Station ID assigned to this device in System Settings → RFID"
                                        className="ui-field w-full rounded-lg border-slate-300 dark:border-slate-700 text-sm py-1.5 px-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums focus:ring-1 focus:ring-red-900"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Queued Scans Notice (if scans arrived during submission) */}
                    {queuedItems.length > 0 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-sm text-amber-900 dark:text-amber-300">
                            <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
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
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-900 dark:text-red-300">
                            <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
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
                        <label htmlFor="rfid-receiving-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal mb-1">
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
                                className="ui-field flex-1 min-w-0 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm tabular-nums focus:border-red-900 focus:ring-1 focus:ring-red-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                            />
                            <Button variant="primary"
                                type="submit"
                                disabled={processing || is100LimitReached || !scanInput.trim()}
                                className=""
                            >
                                Add Tag
                            </Button>
                        </div>
                    </form>

                    <div role="status" aria-live="polite" aria-relevant="additions text" className="space-y-2">
                        {scanNotices.map(notice => (
                            <div key={notice.id} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${notice.kind === 'duplicate' ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"}`}>
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1 break-words">
                                    <p className="font-semibold">{notice.kind === 'duplicate' ? 'Duplicate tag' : 'Unassigned tag'}{notice.count > 1 && <span className="ml-2 tabular-nums">×{notice.count}</span>}</p>
                                    <p className="mt-0.5">{notice.message}</p>
                                </div>
                                <Button variant="ghost" size="icon" type="button" onClick={() => onDismissScanNotice(notice.id)} aria-label={`Dismiss notification: ${notice.message}`} className="shrink-0">
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {isSearching && (
                        <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-red-900 dark:text-red-400" /> Looking up RFID tag in item registry...
                        </p>
                    )}

                    {errorMessage && (
                        <p role="alert" className="leading-relaxed p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300 font-medium">
                            {errorMessage}
                        </p>
                    )}

                    {submitError && (
                        <p role="alert" className="leading-relaxed p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300 font-medium">
                            {submitError}
                        </p>
                    )}

                    {/* Scanned Items Header */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Scanned Items ({scannedItems.length})
                            </h4>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Confirm inspected quantities and costs before receiving · All lines save atomically
                            </span>
                        </div>
                    </div>

                    {/* Scanned Items List */}
                    {scannedItems.length === 0 ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-850/40">
                            <Radio className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-400 mb-2" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">No RFID tags scanned yet</p>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Point the station RFID reader at items, scan with a barcode wedge, or type a tag above.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {scannedItems.map((item, idx) => {
                                const tag = item.rfid_tag || '';
                                const error = rowErrors[tag];
                                const hasCostError = Boolean(error?.cost);
                                const hasQuantityError = Boolean(error?.quantity);
                                const hasSupplierError = Boolean(error?.supplier);

                                return (
                                    <div
                                        key={`${tag}-${idx}`}
                                        className={`p-3.5 border rounded-xl space-y-3 transition-colors ${error ? "border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/30" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            {/* Item Information */}
                                            <div className="min-w-0">
                                                <div className="flex items-start gap-1.5">
                                                    <span className="text-sm tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0 pt-0.5">#{idx + 1}</span>
                                                    <p className="leading-relaxed text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">{item.name}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400 tabular-nums mt-1">
                                                    <span className="font-semibold text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1 py-0.5 rounded border border-red-100 dark:border-red-900/50 break-all">{tag}</span>
                                                    <span className="break-all">SKU: {item.sku || 'N/A'}</span>
                                                    <span>Current Stock: {item.stock ?? 0} {item.unit_of_issue || 'pcs'}</span>
                                                </div>
                                            </div>
                                            <Button variant="secondary"
                                                type="button"
                                                onClick={() => onRemove(tag)}
                                                disabled={processing}
                                                aria-label={`Remove tag ${tag}`}
                                                className="hover:underline shrink-0"
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                                        {/* Supplier Dropdown */}
                                        <Field
                                            id={`rfid-supplier-${tag}`}
                                            label="Supplier"
                                            required
                                            error={hasSupplierError ? error?.supplier : undefined}
                                            className="min-w-0 sm:col-span-5"
                                        >
                                            <select
                                                value={supplierIds[tag] ?? ''}
                                                onChange={event => onSupplierChange(tag, event.target.value ? Number(event.target.value) : '')}
                                                disabled={processing}
                                                className="ui-field w-full"
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
                                                        <option key={s.id} value={s.id} disabled className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                                                            {s.name} (Inactive - Ineligible)
                                                        </option>
                                                    ))}
                                            </select>
                                        </Field>

                                        <Field
                                            id={`rfid-qty-${tag}`}
                                            label="Inspected Qty"
                                            required
                                            error={hasQuantityError ? error?.quantity : undefined}
                                            className="min-w-0 sm:col-span-3"
                                        >
                                            <input
                                                type="number"
                                                min="1"
                                                max="1000000"
                                                step="1"
                                                value={quantities[tag] ?? ''}
                                                onChange={event => onQuantityChange(tag, event.target.value)}
                                                disabled={processing}
                                                className="ui-field w-full tabular-nums"
                                            />
                                        </Field>

                                        {/* Unit Cost Input with Row-level feedback */}
                                        <Field
                                            id={`rfid-cost-${tag}`}
                                            label="Unit Cost (₱)"
                                            required
                                            error={hasCostError ? error?.cost : undefined}
                                            className="min-w-0 sm:col-span-4"
                                        >
                                            <input
                                                type="number"
                                                min="0"
                                                max="9999999999.99"
                                                step="0.01"
                                                value={costs[tag] ?? ''}
                                                onChange={event => onCostChange(tag, event.target.value)}
                                                disabled={processing}
                                                placeholder="0.00"
                                                className="ui-field w-full tabular-nums font-medium"
                                            />
                                        </Field>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Date Received */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal mb-1">
                            Date Received <span className="text-red-600 dark:text-red-300">*</span>
                        </label>
                        <input
                            type="date"
                            value={dateReceived}
                            onChange={event => onDateChange(event.target.value)}
                            disabled={processing}
                            className="ui-field block rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm py-1.5 px-3 focus:border-red-900 focus:ring-1 focus:ring-red-900"
                        />
                    </div>
                </DialogBody>

                {/* Footer */}
                <DialogFooter className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {scannedItems.length > 0 && !hasRowErrors && (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {scannedItems.length} lines · {totalQuantity} units · ₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        )}
                        {hasRowErrors && (
                            <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" /> Resolve {Object.keys(rowErrors).length} item error(s) before receiving
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="button"
                            onClick={onSubmit}
                            disabled={!ready || isSearching || processing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Receiving...
                                </>
                            ) : (
                                `Receive ${scannedItems.length} Item${scannedItems.length === 1 ? '' : 's'}`
                            )}
                        </Button>
                    </div>
                </DialogFooter>
        </Modal>
    );
};
