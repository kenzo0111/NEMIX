import React, { useMemo } from 'react';
import Select from 'react-select';
import { institutionalSelectStyles, getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { InventoryItem, Supplier, ReceivingFormData } from '../types';

interface ReceivingFormProps {
    data: ReceivingFormData;
    setData: (key: keyof ReceivingFormData, value: any) => void;
    errors: Partial<Record<keyof ReceivingFormData, string>>;
    processing: boolean;
    mode: 'create' | 'edit';
    items: InventoryItem[];
    suppliers: Supplier[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export const ReceivingForm: React.FC<ReceivingFormProps> = ({
    data,
    setData,
    errors,
    processing,
    mode,
    items,
    suppliers,
    onSubmit,
    onCancel,
}) => {
    // Format items for React Select
    const itemOptions = useMemo(() => {
        return items.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.sku || 'No SKU'})`,
            item,
        }));
    }, [items]);

    // Format suppliers for React Select
    const supplierOptions = useMemo(() => {
        return suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
        }));
    }, [suppliers]);

    const selectedItemOption = itemOptions.find((opt) => opt.value === data.item_id) || null;
    const selectedSupplierOption =
        supplierOptions.find((opt) => opt.value === data.supplier_id) || null;

    // Handle item selection and automatically prefill supplier if associated
    const handleItemChange = (selected: { value: number; label: string; item: InventoryItem } | null) => {
        if (!selected) {
            setData('item_id', '');
            return;
        }

        const chosenItem = selected.item;
        setData('item_id', chosenItem.id);

        // Prefill supplier if item has an associated default supplier and no supplier is selected yet
        if (chosenItem.supplier_id && !data.supplier_id) {
            setData('supplier_id', chosenItem.supplier_id);
        }
    };

    const hasItemError = Boolean(errors.item_id);
    const hasSupplierError = Boolean(errors.supplier_id);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Item Selection */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Inventory Item <span className="text-red-600">*</span>
                </label>
                <Select
                    value={selectedItemOption}
                    onChange={handleItemChange}
                    options={itemOptions}
                    placeholder="Search and select an item..."
                    isClearable
                    styles={hasItemError ? getInstitutionalSelectStyles(true) : institutionalSelectStyles}
                    classNamePrefix="react-select"
                />
                {errors.item_id && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.item_id}</p>
                )}
            </div>

            {/* Supplier Selection */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Supplier <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">
                        Deliveries can be received from any vendor
                    </span>
                </div>
                <Select
                    value={selectedSupplierOption}
                    onChange={(selected) => setData('supplier_id', selected ? selected.value : '')}
                    options={supplierOptions}
                    placeholder="Select supplier..."
                    isClearable
                    styles={hasSupplierError ? getInstitutionalSelectStyles(true) : institutionalSelectStyles}
                    classNamePrefix="react-select"
                />
                {errors.supplier_id && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.supplier_id}</p>
                )}
            </div>

            {/* Supplier Stock Number */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Supplier Stock No.
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">
                        Preserved per batch (used in RPCI compliance report)
                    </span>
                </div>
                <input
                    type="text"
                    value={data.supplier_stock_no || ''}
                    onChange={(e) => setData('supplier_stock_no', e.target.value)}
                    placeholder="e.g. APC-26-09-001-0001 or COS-26-09-001-0001"
                    className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono font-medium focus:outline-none transition-colors ${
                        errors.supplier_stock_no
                            ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            : 'border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900'
                    }`}
                />
                {errors.supplier_stock_no && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.supplier_stock_no}</p>
                )}
            </div>

            {/* Quantity, Unit Cost, and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Quantity Received <span className="text-red-600">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={data.quantity}
                        onChange={(e) => setData('quantity', e.target.value ? parseInt(e.target.value, 10) : '')}
                        placeholder="e.g. 50"
                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-medium focus:outline-none transition-colors ${
                            errors.quantity
                                ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                                : 'border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900'
                        }`}
                    />
                    {errors.quantity && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.quantity}</p>
                    )}
                </div>

                {/* Unit Cost */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Unit Cost (₱)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.unit_cost !== undefined ? data.unit_cost : ''}
                        onChange={(e) => setData('unit_cost', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono font-medium focus:outline-none transition-colors ${
                            errors.unit_cost
                                ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                                : 'border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900'
                        }`}
                    />
                    {errors.unit_cost && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.unit_cost}</p>
                    )}
                </div>

                {/* Batch Total Amount Preview */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Batch Total (₱)
                    </label>
                    <input
                        type="text"
                        readOnly
                        disabled
                        value={
                            data.quantity && data.unit_cost
                                ? `₱${(Number(data.quantity) * Number(data.unit_cost)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '₱0.00'
                        }
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono font-bold text-gray-900 cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Date Received */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Date Received <span className="text-red-600">*</span>
                </label>
                <input
                    type="date"
                    value={data.date_received}
                    onChange={(e) => setData('date_received', e.target.value)}
                    className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-medium focus:outline-none transition-colors ${
                        errors.date_received
                            ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            : 'border-gray-300 focus:border-red-900 focus:ring-1 focus:ring-red-900'
                    }`}
                />
                {errors.date_received && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.date_received}</p>
                )}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-950 active:bg-red-900 rounded-md shadow-xs focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>{mode === 'edit' ? 'Update Receiving' : 'Save Receiving'}</>
                    )}
                </button>
            </div>
        </form>
    );
};
