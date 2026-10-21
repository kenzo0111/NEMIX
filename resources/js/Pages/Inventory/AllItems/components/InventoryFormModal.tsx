import React, { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import { Portal } from '@headlessui/react';
import Select from 'react-select';
import axios from 'axios';
import { X, Loader2, Lock, PackagePlus, Edit3, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { Supplier, InventoryItem, SelectOption } from '../types';
import { customSelectStyles } from '../constants';
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
    criticalStockThreshold?: number;
    unitsOfIssue: string[];
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
    criticalStockThreshold = 3,
    unitsOfIssue,
    onClose,
    onSubmit,
    onViewExistingItem,
}: InventoryFormModalProps) {
    const [isGeneratingStockNo, setIsGeneratingStockNo] = useState(false);
    const [selectPortal, setSelectPortal] = useState<HTMLDivElement | null>(null);
    const formSelectStyles = {
        ...customSelectStyles,
        control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
            ...customSelectStyles.control(base, state),
            minHeight: '44px',
            minWidth: 0,
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
        }),
        menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 100 }),
    };

    // Initial batch accordion state: collapsed by default when registering empty item,
    // auto-expanded if there are errors, stock already entered, or when editing.
    const hasInitialStockData = Number(data.stock) > 0 || !!data.supplier_id || Number(data.unit_cost) > 0;
    const hasBatchErrors = !!(errors.supplier_id || errors.supplier_stock_no || errors.stock || errors.unit_cost);
    const [isBatchExpanded, setIsBatchExpanded] = useState<boolean>(isEditing || hasInitialStockData || hasBatchErrors);

    useEffect(() => {
        if (hasBatchErrors || (hasInitialStockData && !isEditing)) {
            setIsBatchExpanded(true);
        }
    }, [hasBatchErrors, hasInitialStockData, isEditing]);

    useEffect(() => {
        if (!show) setIsBatchExpanded(false);
    }, [show]);

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
        setData('status', computeStatusFromStock(data.stock, lowStockThreshold, criticalStockThreshold));
    }, [data.stock, lowStockThreshold, criticalStockThreshold]);

    const supplierOptions: SelectOption<number>[] = suppliers.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const selectedSupplierOption = supplierOptions.find(
        (opt) => String(opt.value) === String(data.supplier_id)
    ) || null;

    const unitOptions = unitsOfIssue.map((unit) => ({ value: unit, label: unit }));
    if (isEditing && data.unit_of_issue && !unitsOfIssue.includes(data.unit_of_issue)) {
        unitOptions.push({ value: data.unit_of_issue, label: `${data.unit_of_issue} (existing unit)` });
    }
    const selectedUnitOption = unitOptions.find(
        (opt) => opt.value === data.unit_of_issue
    ) || null;

    const computedBatchTotal = (Number(data.stock || 0) * Number(data.unit_cost || 0));

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="3xl"
            closeable={!processing}
            ariaLabel={isEditing ? 'Edit Item Master' : 'Register New Item Master'}
        >
            <div className="relative flex max-h-[calc(100dvh-3rem)] flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
                <Portal><div ref={setSelectPortal} /></Portal>
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Modal Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-5 sm:px-8 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                            {isEditing ? (
                                <Edit3 className="w-4 h-4 text-red-900 dark:text-red-400" />
                            ) : (
                                <PackagePlus className="w-4 h-4 text-red-900 dark:text-red-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight font-sans truncate">
                                {isEditing ? 'Edit Item Master' : 'Register Item Master'}
                            </h3>
                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
                                {isEditing
                                    ? 'Update standardized item master specifications.'
                                    : 'Add item details. Opening stock can be recorded now or later.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
                        aria-label="Close dialog"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Duplicate Item Master Warning Banner */}
                {potentialDuplicate && (
                    <div className="shrink-0 mx-6 mt-4 p-3 sm:mx-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="text-sm">
                            <p className="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Existing Item Found: "{potentialDuplicate.name}"</span>
                            </p>
                            <p className="leading-relaxed mt-1 text-sm text-amber-800 dark:text-amber-300">
                                If receiving from a new supplier or batch, record a Receiving instead.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {onViewExistingItem && (
                                <button
                                    type="button"
                                    onClick={() => onViewExistingItem(potentialDuplicate)}
                                    className="px-2.5 py-1 text-sm font-semibold text-amber-950 dark:text-amber-100 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                >
                                    View Existing
                                </button>
                            )}
                            <a
                                href="/inventory/receiving"
                                className="px-2.5 py-1 text-sm font-semibold text-white bg-red-950 hover:bg-red-900 rounded-lg transition-colors shadow-2xs"
                            >
                                Receiving
                            </a>
                        </div>
                    </div>
                )}

                {/* Modal Form */}
                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 space-y-6">
                        {/* 1. Item Information Card */}
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                <div>
                                    <label htmlFor="inventory_item_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Item Name <span className="text-red-600" aria-hidden="true">*</span>
                                        <span className="sr-only"> (required)</span>
                                    </label>
                                    <input
                                        id="inventory_item_name"
                                        name="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. A4 Bond Paper 80 GSM"
                                        required
                                        aria-required="true"
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={errors.name ? 'inventory_item_name-error' : undefined}
                                        disabled={processing}
                                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all ${
                                            errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                        }`}
                                    />
                                    {errors.name && (
                                        <p id="inventory_item_name-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="inventory_unit_of_issue" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Unit of Issue <span className="text-red-600" aria-hidden="true">*</span>
                                        <span className="sr-only"> (required)</span>
                                    </label>
                                    <Select
                                        inputId="inventory_unit_of_issue"
                                        name="unit_of_issue"
                                        aria-label="Unit of Issue"
                                        aria-invalid={Boolean(errors.unit_of_issue)}
                                        aria-describedby={errors.unit_of_issue ? 'inventory_unit_of_issue-error' : undefined}
                                        value={selectedUnitOption}
                                        onChange={(opt) => setData('unit_of_issue', opt ? opt.value : '')}
                                        options={unitOptions}
                                        placeholder="Select unit..."
                                        styles={formSelectStyles}
                                        menuPortalTarget={selectPortal}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        menuShouldScrollIntoView={false}
                                        maxMenuHeight={220}
                                        isClearable
                                        classNamePrefix="react-select"
                                        isDisabled={processing}
                                    />
                                    {errors.unit_of_issue && (
                                        <p id="inventory_unit_of_issue-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                            {errors.unit_of_issue}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="inventory_description" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Description / Specifications <span className="text-gray-400 dark:text-slate-500 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="inventory_description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Specifications, dimensions, material, or packaging details..."
                                        rows={3}
                                        disabled={processing}
                                        aria-invalid={Boolean(errors.description)}
                                        aria-describedby={errors.description ? 'inventory_description-error' : undefined}
                                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm font-normal text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all ${
                                            errors.description ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p id="inventory_description-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Opening stock / Stock Baseline (Accordion Card) */}
                        {isEditing ? (
                            <div className="border border-gray-200/90 dark:border-slate-800 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                        Current Stock & Valuation
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-slate-400">
                                        Aggregated from active batches
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium">On Hand</p>
                                        <p className="leading-relaxed text-sm font-bold tabular-nums text-gray-900 dark:text-slate-100 mt-1">
                                            {data.stock} {data.unit_of_issue || 'units'}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium">Unit Cost</p>
                                        <p className="leading-relaxed text-sm font-bold tabular-nums text-gray-900 dark:text-slate-100 mt-1">
                                            ₱{Number(data.unit_cost || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium">Valuation</p>
                                        <p className="leading-relaxed text-sm font-bold tabular-nums text-red-950 dark:text-red-400 mt-1">
                                            ₱{computedBatchTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-950/30">
                                <button
                                    type="button"
                                    onClick={() => setIsBatchExpanded(!isBatchExpanded)}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50/70 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors text-left cursor-pointer"
                                    aria-expanded={isBatchExpanded}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                                Opening stock
                                            </span>
                                            <span className="text-sm normal-case font-bold tracking-normal px-1.5 py-0.5 text-gray-500 dark:text-slate-400 bg-gray-200/70 dark:bg-slate-700 rounded">
                                                Optional
                                            </span>
                                            {Number(data.stock) > 0 && (
                                                <span className="text-sm font-semibold text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full tabular-nums">
                                                    {data.stock} units
                                                </span>
                                            )}
                                        </div>
                                        <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {isBatchExpanded
                                                ? 'Record the supplier, quantity, and unit cost.'
                                                : 'Optional. You can receive stock later.'}
                                        </p>
                                    </div>
                                    <div className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                        {isBatchExpanded ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>

                                {isBatchExpanded && (
                                    <div className="p-5 border-t border-gray-200/70 dark:border-slate-800 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
                                            <div>
                                                <label htmlFor="inventory_supplier_id" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Preferred Supplier {Number(data.stock) > 0 && <span className="text-red-600" aria-hidden="true">*</span>}
                                                    {Number(data.stock) > 0 && <span className="sr-only"> (required)</span>}
                                                </label>
                                                <Select
                                                    inputId="inventory_supplier_id"
                                                    name="supplier_id"
                                                    aria-label="Preferred Supplier"
                                                    aria-invalid={Boolean(errors.supplier_id)}
                                                    aria-describedby={errors.supplier_id ? 'inventory_supplier_id-error' : undefined}
                                                    value={selectedSupplierOption}
                                                    onChange={(opt) => setData('supplier_id', opt ? opt.value : '')}
                                                    options={supplierOptions}
                                                    placeholder="Select supplier..."
                                                    styles={formSelectStyles}
                                        menuPortalTarget={selectPortal}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        menuShouldScrollIntoView={false}
                                        maxMenuHeight={220}
                                                    isClearable
                                                    classNamePrefix="react-select"
                                                    isDisabled={processing}
                                                />
                                                {errors.supplier_id && (
                                                    <p id="inventory_supplier_id-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errors.supplier_id}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="inventory_supplier_stock_no" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Supplier Stock No. / SKU
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="inventory_supplier_stock_no"
                                                        name="supplier_stock_no"
                                                        type="text"
                                                        value={data.supplier_stock_no || ''}
                                                        readOnly
                                                        placeholder={data.supplier_id ? 'Generating SKU...' : 'Auto-generated with vendor'}
                                                        aria-invalid={Boolean(errors.supplier_stock_no)}
                                                        aria-describedby={errors.supplier_stock_no ? 'inventory_supplier_stock_no-error' : undefined}
                                                        className={`w-full px-3 py-2 pr-8 bg-gray-50 dark:bg-slate-800/60 border rounded-lg text-sm tabular-nums font-medium text-gray-900 dark:text-slate-100 cursor-not-allowed ${
                                                            errors.supplier_stock_no ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                                                        {isGeneratingStockNo ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-900 dark:text-red-400" />
                                                        ) : (
                                                            <Lock className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                {errors.supplier_stock_no && (
                                                    <p id="inventory_supplier_stock_no-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errors.supplier_stock_no}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            <div>
                                                <label htmlFor="inventory_stock" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Initial Stock
                                                </label>
                                                <input
                                                    id="inventory_stock"
                                                    name="stock"
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
                                                    aria-invalid={Boolean(errors.stock)}
                                                    aria-describedby={errors.stock ? 'inventory_stock-error' : undefined}
                                                    className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm tabular-nums font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 ${
                                                        errors.stock ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errors.stock && (
                                                    <p id="inventory_stock-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errors.stock}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="inventory_unit_cost" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Unit Cost (₱) {Number(data.stock) > 0 && <span className="text-red-600" aria-hidden="true">*</span>}
                                                    {Number(data.stock) > 0 && <span className="sr-only"> (required)</span>}
                                                </label>
                                                <input
                                                    id="inventory_unit_cost"
                                                    name="unit_cost"
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
                                                    aria-invalid={Boolean(errors.unit_cost)}
                                                    aria-describedby={errors.unit_cost ? 'inventory_unit_cost-error' : undefined}
                                                    className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm tabular-nums font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 ${
                                                        errors.unit_cost ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errors.unit_cost && (
                                                    <p id="inventory_unit_cost-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errors.unit_cost}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                    Batch Total
                                                </label>
                                                <div className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-sm tabular-nums font-bold text-gray-900 dark:text-slate-100 flex items-center justify-between">
                                                    <span>₱</span>
                                                    <span>{computedBatchTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Keep actions visible while the form body scrolls. */}
                    <div className="shrink-0 px-6 py-4 sm:px-8 bg-gray-50/80 dark:bg-slate-950/60 border-t border-gray-200/80 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none transition-colors disabled:opacity-50 text-center cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-red-950 hover:bg-red-900 rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {processing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isEditing ? 'Save Changes' : 'Save Item Master'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
