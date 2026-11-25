import React, { useMemo, useEffect } from 'react';
import Select from 'react-select';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import useValidationFocus from '@/Hooks/useValidationFocus';
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

const getSupplierAcronym = (supplierName?: string): string => {
    if (!supplierName) return 'GEN';
    const clean = supplierName.trim();
    const words = clean.split(/[\s\-_]+/);
    const letters: string[] = [];
    for (const word of words) {
        const charOnly = word.replace(/[^A-Za-z0-9]/g, '');
        if (charOnly) {
            letters.push(charOnly[0].toUpperCase());
        }
    }
    if (letters.length < 3 && words[0]) {
        const cleanFirst = words[0].replace(/[^A-Za-z0-9]/g, '');
        for (let i = 1; i < cleanFirst.length && letters.length < 3; i++) {
            letters.push(cleanFirst[i].toUpperCase());
        }
    }
    while (letters.length < 3) {
        letters.push('X');
    }
    return letters.slice(0, 3).join('');
};

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
    useValidationFocus(errors);

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

        if (chosenItem.supplier_id && !data.supplier_id) {
            setData('supplier_id', chosenItem.supplier_id);
        }
    };

    // Automatic supplier stock number generation
    useEffect(() => {
        if (mode === 'edit' && data.supplier_stock_no) {
            return;
        }

        if (data.item_id && data.supplier_id) {
            const supplier = suppliers.find((s) => s.id === Number(data.supplier_id));
            const acronym = getSupplierAcronym(supplier?.name);
            const dateStr = data.date_received || new Date().toISOString().slice(0, 10);
            const cleanDate = dateStr.replace(/-/g, '');
            const generated = `${acronym}-${cleanDate}-${data.item_id}`;
            setData('supplier_stock_no', generated);
        }
    }, [data.item_id, data.supplier_id, data.date_received, mode]);

    return (
        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="space-y-5">
                {/* Item Selection */}
                <Field
                    id="receiving_item_id"
                    label="Item"
                    required
                    error={errors.item_id}
                >
                    <Select
                        inputId="receiving_item_id"
                        name="item_id"
                        aria-label="Item"
                        aria-invalid={Boolean(errors.item_id)}
                        value={selectedItemOption}
                        onChange={handleItemChange}
                        options={itemOptions}
                        placeholder="Search item by name or stock number..."
                        isClearable
                        styles={getInstitutionalSelectStyles(Boolean(errors.item_id))}
                        classNamePrefix="react-select"
                        isDisabled={processing}
                    />
                </Field>

                {/* Supplier Selection */}
                <Field
                    id="receiving_supplier_id"
                    label="Supplier"
                    required
                    error={errors.supplier_id}
                    hint="Deliveries can be received from any accredited vendor"
                >
                    <Select
                        inputId="receiving_supplier_id"
                        name="supplier_id"
                        aria-label="Supplier"
                        aria-invalid={Boolean(errors.supplier_id)}
                        value={selectedSupplierOption}
                        onChange={(selected) => setData('supplier_id', selected ? selected.value : '')}
                        options={supplierOptions}
                        placeholder="Select supplier..."
                        isClearable
                        styles={getInstitutionalSelectStyles(Boolean(errors.supplier_id))}
                        classNamePrefix="react-select"
                        isDisabled={processing}
                    />
                </Field>

                {/* Supplier Stock Number (Automatic) */}
                <Field
                    id="receiving_supplier_stock_no"
                    label="Supplier Stock No."
                    error={errors.supplier_stock_no}
                    hint="Automatically generated per receiving batch and retained for RPCI reporting."
                >
                    <div className="relative">
                        <input
                            id="receiving_supplier_stock_no"
                            name="supplier_stock_no"
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={data.supplier_stock_no || ''}
                            placeholder="Auto-generated after item & supplier selection"
                            className="ui-field w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800/60 tabular-nums font-semibold cursor-not-allowed select-none"
                        />
                    </div>
                </Field>

                {/* Quantity, Unit Cost, and Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Quantity */}
                    <Field
                        id="receiving_quantity"
                        label="Quantity Received"
                        required
                        error={errors.quantity}
                    >
                        <input
                            id="receiving_quantity"
                            name="quantity"
                            type="number"
                            min="1"
                            max="1000000"
                            required
                            aria-required="true"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', e.target.value ? parseInt(e.target.value, 10) : '')}
                            placeholder="e.g. 50"
                            className="ui-field w-full px-3 py-2 tabular-nums"
                            disabled={processing}
                        />
                    </Field>

                    {/* Unit Cost */}
                    <Field
                        id="receiving_unit_cost"
                        label="Unit Cost (₱)"
                        error={errors.unit_cost}
                    >
                        <input
                            id="receiving_unit_cost"
                            name="unit_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.unit_cost !== undefined ? data.unit_cost : ''}
                            onChange={(e) => setData('unit_cost', e.target.value)}
                            placeholder="0.00"
                            className="ui-field w-full px-3 py-2 tabular-nums"
                            disabled={processing}
                        />
                    </Field>

                    {/* Batch Total Amount Preview */}
                    <Field
                        id="receiving_batch_total"
                        label="Batch Total (₱)"
                    >
                        <input
                            id="receiving_batch_total"
                            type="text"
                            readOnly
                            disabled
                            value={
                                data.quantity && data.unit_cost
                                    ? `₱${(Number(data.quantity) * Number(data.unit_cost)).toLocaleString('en-PH', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                      })}`
                                    : '₱0.00'
                            }
                            className="ui-field w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 tabular-nums font-semibold cursor-not-allowed"
                        />
                    </Field>
                </div>

                {/* Date Received */}
                <Field
                    id="receiving_date_received"
                    label="Date Received"
                    required
                    error={errors.date_received}
                >
                    <input
                        id="receiving_date_received"
                        name="date_received"
                        type="date"
                        required
                        aria-required="true"
                        value={data.date_received}
                        onChange={(e) => setData('date_received', e.target.value)}
                        className="ui-field w-full px-3 py-2 tabular-nums"
                        disabled={processing}
                    />
                </Field>
            </DialogBody>

            <DialogFooter>
                <Button
                    variant="secondary"
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={processing}
                    loading={processing}
                >
                    {mode === 'edit' ? 'Update Receiving' : 'Save Receiving'}
                </Button>
            </DialogFooter>
        </form>
    );
};
