import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { X, Loader2 } from 'lucide-react';
import { Supplier, InventoryItem, SelectOption } from '../types';
import { UNIT_OF_ISSUE_OPTIONS, customSelectStyles } from '../constants';
import { generateSkuPreview, computeStatusFromStock } from '../utils/inventory';

export interface InventoryFormData {
    name: string;
    supplier_id: string | number;
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
}: InventoryFormModalProps) {
    // Automatically update SKU preview when selecting supplier in Add mode
    useEffect(() => {
        if (!isEditing && data.supplier_id && suppliers.length > 0) {
            const supplier = suppliers.find((s) => String(s.id) === String(data.supplier_id));
            if (supplier?.name) {
                const previewSku = generateSkuPreview(existingItems, supplier.name, supplier.id);
                setData('sku', previewSku);
            }
        }
    }, [data.supplier_id, isEditing, existingItems, suppliers]);

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

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" closeable={!processing}>
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-red-950" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight font-serif">
                            {isEditing ? 'Edit Inventory Item' : 'Add Inventory Item'}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {isEditing
                                ? 'Update the selected inventory record in the university master list.'
                                : 'Register a new consumable inventory item.'}
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

                {/* Modal Form */}
                <form onSubmit={onSubmit}>
                    <div className="p-6 space-y-4">
                        {/* Group 1: Supplier + Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Supplier <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    value={selectedSupplierOption}
                                    onChange={(opt) => setData('supplier_id', opt ? opt.value : '')}
                                    options={supplierOptions}
                                    placeholder="Select a supplier..."
                                    styles={customSelectStyles}
                                    classNamePrefix="react-select"
                                    isDisabled={isEditing || processing}
                                />
                                {errors.supplier_id && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.supplier_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Status
                                </label>
                                <input
                                    type="text"
                                    value={data.status}
                                    readOnly
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-medium text-gray-700 cursor-not-allowed"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Computed automatically from stock level (threshold: {lowStockThreshold} units).
                                </p>
                                {errors.status && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Group 2: Item Name + SKU */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Item Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Bond Paper A4 80gsm"
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
                                    SKU / Code
                                </label>
                                <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    placeholder="Auto-generated"
                                    disabled={!isEditing || processing}
                                    className={`w-full px-3 py-2 border rounded-md text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900 ${
                                        !isEditing ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'bg-white border-gray-300'
                                    }`}
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    {!isEditing
                                        ? 'Preview shown. Authoritative unique SKU is verified and saved by the system.'
                                        : 'Leave blank to preserve or auto-generate.'}
                                </p>
                                {errors.sku && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.sku}</p>
                                )}
                            </div>
                        </div>

                        {/* Group 3: Unit of Issue + Initial Stock + Unit Cost */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Unit of Issue
                                </label>
                                <Select
                                    value={selectedUnitOption}
                                    onChange={(opt) => setData('unit_of_issue', opt ? opt.value : '')}
                                    options={UNIT_OF_ISSUE_OPTIONS}
                                    placeholder="Select unit..."
                                    styles={customSelectStyles}
                                    isClearable
                                    classNamePrefix="react-select"
                                    isDisabled={processing}
                                />
                                {errors.unit_of_issue && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit_of_issue}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Initial Stock <span className="text-red-600">*</span>
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
                                    required
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
                                    Unit Cost (₱)
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
                        </div>

                        {/* Group 4: Description + Amount */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Description / Specifications
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Specifications, dimensions, brand notes..."
                                    rows={3}
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
                                    Total Amount (₱)
                                </label>
                                <input
                                    type="text"
                                    value={data.amount}
                                    readOnly
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-bold text-gray-900 cursor-not-allowed"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Calculated as Stock × Unit Cost. Verified authoritatively upon save.
                                </p>
                                {errors.amount && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.amount}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-xs"
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
