import React, { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import axios from 'axios';
import { X, Loader2, Lock } from 'lucide-react';
import { Supplier, InventoryItem, SelectOption } from '../types';
import { UNIT_OF_ISSUE_OPTIONS, customSelectStyles } from '../constants';
import { computeStatusFromStock } from '../utils/inventory';

export interface InventoryFormData {
    name: string;
    supplier_id: string | number;
    supplier_stock_no: string;
    sku: string;
    stock: number;
    unit_cost: string | number;
    amount: string | number;
    status: string;
    description: string;
    unit_of_issue: string;
}

interface InventoryFormModalProps {
    show: boolean;
    isEditing: boolean;
    data: InventoryFormData;
    setData: (key: any, value?: any) => void;
    errors: Record<string, string | undefined>;
    processing: boolean;
    suppliers: Supplier[];
    existingItems: InventoryItem[];
    lowStockThreshold?: number;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onViewExistingItem?: (item: InventoryItem) => void;
}

export default function InventoryFormModal({
    show,
    isEditing,
    data,
    setData,
    errors,
    processing,
    suppliers = [],
    existingItems = [],
    lowStockThreshold = 10,
    onClose,
    onSubmit,
    onViewExistingItem,
}: InventoryFormModalProps) {
    const [isGeneratingStockNo, setIsGeneratingStockNo] = useState(false);

    // Duplicate master item detection based on canonical name and unit
    const potentialDuplicate = React.useMemo(() => {
        if (isEditing || !data.name || data.name.trim().length < 3) return null;
        const normalizedInputName = data.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedInputUnit = (data.unit_of_issue || '').trim().toLowerCase();

        return existingItems.find((item) => {
            const normalizedItemName = (item.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const normalizedItemUnit = (item.unit_of_issue || '').trim().toLowerCase();
            
            if (normalizedInputName === normalizedItemName) {
                if (!normalizedInputUnit || !normalizedItemUnit) return true;
                return normalizedInputUnit === normalizedItemUnit;
            }
            return false;
        }) || null;
    }, [data.name, data.unit_of_issue, existingItems, isEditing]);

    // Dynamic backend-authoritative Supplier Stock No. / SKU generation
    useEffect(() => {
        if (isEditing) {
            return;
        }

        if (data.supplier_id) {
            let isMounted = true;
            setIsGeneratingStockNo(true);

            axios.get('/inventory/generate-supplier-stock-no', {
                params: {
                    supplier_id: data.supplier_id,
                },
            }).then((res) => {
                if (isMounted && res.data?.supplier_stock_no) {
                    setData('supplier_stock_no', res.data.supplier_stock_no);
                }
            }).catch(() => {
                // If network fails, leave current or blank
            }).finally(() => {
                if (isMounted) {
                    setIsGeneratingStockNo(false);
                }
            });

            return () => {
                isMounted = false;
            };
        } else {
            setData('supplier_stock_no', '');
        }
    }, [data.supplier_id, isEditing]);

    // Automatically recalculate status preview on stock level change
    useEffect(() => {
        setData('status', computeStatusFromStock(data.stock, lowStockThreshold));
    }, [data.stock, lowStockThreshold]);

    const supplierOptions: SelectOption<number>[] = suppliers.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const selectedSupplierOption = supplierOptions.find(
        (opt) => String(opt.value) === String(data.supplier_id)
    ) || null;

    const selectedUnitOption = UNIT_OF_ISSUE_OPTIONS.find(
        (opt) => opt.value === data.unit_of_issue
    ) || null;

    const computedBatchTotal = (Number(data.stock || 0) * Number(data.unit_cost || 0));

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" closeable={!processing}>
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-red-950" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight font-serif">
                            {isEditing ? 'Edit Item Master' : 'Register New Item Master'}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {isEditing
                                ? 'Update the master specifications and identity for this consumable inventory item.'
                                : 'Define the standardized item master identity. Receiving batches and suppliers are tracked separately.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors disabled:opacity-40"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Duplicate Item Master Warning Banner */}
                {potentialDuplicate && (
                    <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs">
                            <p className="font-bold flex items-center gap-1.5 text-amber-950">
                                <span>⚠️</span> Potential Duplicate Item Master Detected
                            </p>
                            <p className="mt-0.5 text-amber-800">
                                An item named <span className="font-semibold text-gray-900 font-mono">"{potentialDuplicate.name}"</span> is already registered. If receiving stock from a new supplier or at a different cost, record a <strong>Receiving</strong> instead of creating a duplicate item.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {onViewExistingItem && (
                                <button
                                    type="button"
                                    onClick={() => onViewExistingItem(potentialDuplicate)}
                                    className="px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded transition-colors shadow-xs"
                                >
                                    View Existing
                                </button>
                            )}
                            <a
                                href="/inventory/receiving"
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded transition-colors shadow-xs"
                            >
                                Go to Receiving
                            </a>
                        </div>
                    </div>
                )}

                {/* Modal Form */}
                <form onSubmit={onSubmit}>
                    <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        {/* ==================================================== */}
                        {/* 1. ITEM INFORMATION */}
                        {/* ==================================================== */}
                        <div>
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Item Information
                                </h4>
                                <span className="text-[11px] text-gray-500">
                                    Standardized Item Master Specifications
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Item Name <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g. A4 Bond Paper 80 GSM"
                                            required
                                            disabled={processing}
                                            className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 ${
                                                errors.name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Unit of Issue <span className="text-red-600">*</span>
                                        </label>
                                        <Select
                                            value={selectedUnitOption}
                                            onChange={(opt) => setData('unit_of_issue', opt ? opt.value : '')}
                                            options={UNIT_OF_ISSUE_OPTIONS}
                                            placeholder="Select unit (e.g. ream, piece, box)..."
                                            styles={customSelectStyles}
                                            isClearable
                                            classNamePrefix="react-select"
                                            isDisabled={processing}
                                        />
                                        {errors.unit_of_issue && (
                                            <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit_of_issue}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Description / Specifications
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Specifications, dimensions, material, or packaging details..."
                                        rows={2}
                                        disabled={processing}
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 ${
                                            errors.description ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Stock Status
                                    </label>
                                    <input
                                        type="text"
                                        value={data.status}
                                        readOnly
                                        disabled
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-medium text-gray-700 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        Automatically calculated from on-hand stock (low stock threshold: {lowStockThreshold} units).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ==================================================== */}
                        {/* 2. INITIAL RECEIVING BATCH / BASELINE */}
                        {/* ==================================================== */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-1 pb-2 mb-3 border-b border-gray-100">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {isEditing ? 'Current Stock & Valuation' : 'Initial Receiving Batch / Baseline'}
                                </h4>
                                <span className="text-[11px] text-gray-500">
                                    {isEditing
                                        ? 'Subsequent deliveries are tracked in Receiving'
                                        : Number(data.stock) > 0 ? 'Batch preserved with selected supplier' : 'Optional if creating item master with 0 initial stock'}
                                </span>
                            </div>

                            {isEditing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Current Stock
                                        </label>
                                        <input
                                            type="number"
                                            value={data.stock}
                                            disabled
                                            readOnly
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-medium text-gray-700 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Aggregated from active batches.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Unit Cost (₱)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.unit_cost}
                                            disabled
                                            readOnly
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-medium text-gray-700 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Reference / weighted unit cost.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Current Valuation
                                        </label>
                                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-bold text-gray-900 flex items-center justify-between">
                                            <span>₱</span>
                                            <span>{computedBatchTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Sum of active batch values.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Preferred Supplier {Number(data.stock) > 0 && <span className="text-red-600">*</span>}
                                            </label>
                                            <Select
                                                value={selectedSupplierOption}
                                                onChange={(opt) => setData('supplier_id', opt ? opt.value : '')}
                                                options={supplierOptions}
                                                placeholder="Select preferred supplier..."
                                                styles={customSelectStyles}
                                                isClearable
                                                classNamePrefix="react-select"
                                                isDisabled={processing}
                                            />
                                            {errors.supplier_id && (
                                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.supplier_id}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Supplier Stock No. / SKU
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={data.supplier_stock_no || ''}
                                                    readOnly
                                                    placeholder={data.supplier_id ? 'Generating stock number...' : 'Select a supplier to generate stock number...'}
                                                    className={`w-full px-3 py-2 pr-9 bg-gray-50 border rounded-md text-xs font-mono font-medium text-gray-900 cursor-not-allowed focus:outline-none ${
                                                        errors.supplier_stock_no ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
                                                    {isGeneratingStockNo ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-900" />
                                                    ) : (
                                                        <Lock className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                Generated for the selected supplier and preserved with the initial receiving batch.
                                            </p>
                                            {errors.supplier_stock_no && (
                                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.supplier_stock_no}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Initial Stock
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.stock}
                                                onChange={(e) => {
                                                    const newStock = parseInt(e.target.value, 10) || 0;
                                                    const cost = parseFloat(String(data.unit_cost)) || 0;
                                                    setData('stock', newStock);
                                                    setData('amount', (newStock * cost).toFixed(2));
                                                }}
                                                disabled={processing}
                                                className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 ${
                                                    errors.stock ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.stock && (
                                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.stock}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Unit Cost (₱) {Number(data.stock) > 0 && <span className="text-red-600">*</span>}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.unit_cost}
                                                onChange={(e) => {
                                                    const newCost = parseFloat(e.target.value) || 0;
                                                    const currentStock = Number(data.stock) || 0;
                                                    setData('unit_cost', e.target.value);
                                                    setData('amount', (currentStock * newCost).toFixed(2));
                                                }}
                                                placeholder="0.00"
                                                disabled={processing}
                                                className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 ${
                                                    errors.unit_cost ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.unit_cost && (
                                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit_cost}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Batch Total
                                            </label>
                                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-bold text-gray-900 flex items-center justify-between">
                                                <span>₱</span>
                                                <span>{computedBatchTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                Initial batch valuation (Stock × Unit Cost).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{isEditing ? 'Save Changes' : 'Save Item'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
