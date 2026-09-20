import React, { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import axios from 'axios';
import { X, Loader2, Lock, PackagePlus, Edit3, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
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
        <Modal
            show={show}
            onClose={onClose}
            maxWidth="lg"
            closeable={!processing}
            ariaLabel={isEditing ? 'Edit Item Master' : 'Register New Item Master'}
        >
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                            {isEditing ? (
                                <Edit3 className="w-4 h-4 text-red-900 dark:text-red-400" />
                            ) : (
                                <PackagePlus className="w-4 h-4 text-red-900 dark:text-red-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 tracking-tight font-serif truncate">
                                {isEditing ? 'Edit Item Master' : 'Register Item Master'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                                {isEditing
                                    ? 'Update standardized item master specifications.'
                                    : 'Create a standardized catalog entry for university supplies.'}
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
                    <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="text-xs">
                            <p className="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Existing Item Found: "{potentialDuplicate.name}"</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                                If receiving from a new supplier or batch, record a Receiving instead.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {onViewExistingItem && (
                                <button
                                    type="button"
                                    onClick={() => onViewExistingItem(potentialDuplicate)}
                                    className="px-2.5 py-1 text-xs font-semibold text-amber-950 dark:text-amber-100 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                >
                                    View Existing
                                </button>
                            )}
                            <a
                                href="/inventory/receiving"
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-lg transition-colors shadow-2xs"
                            >
                                Receiving
                            </a>
                        </div>
                    </div>
                )}

                {/* Modal Form */}
                <form onSubmit={onSubmit}>
                    <div className="p-5 space-y-4 max-h-[calc(85vh-8.5rem)] overflow-y-auto">
                        {/* 1. Item Information Card */}
                        <div className="border border-gray-200/90 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3.5">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                                    Item Information
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    data.status === 'Available'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                }`}>
                                    ● {data.status || 'Available'}
                                </span>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <label htmlFor="inventory_item_name" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all ${
                                            errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                        }`}
                                    />
                                    {errors.name && (
                                        <p id="inventory_item_name-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="inventory_unit_of_issue" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                        options={UNIT_OF_ISSUE_OPTIONS}
                                        placeholder="Select unit (e.g. ream, piece, box)..."
                                        styles={customSelectStyles}
                                        isClearable
                                        classNamePrefix="react-select"
                                        isDisabled={processing}
                                    />
                                    {errors.unit_of_issue && (
                                        <p id="inventory_unit_of_issue-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                            {errors.unit_of_issue}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="inventory_description" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Description / Specifications <span className="text-gray-400 dark:text-slate-500 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="inventory_description"
                                        name="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Specifications, dimensions, material, or packaging details..."
                                        rows={2}
                                        disabled={processing}
                                        aria-invalid={Boolean(errors.description)}
                                        aria-describedby={errors.description ? 'inventory_description-error' : undefined}
                                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-normal text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all ${
                                            errors.description ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p id="inventory_description-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Initial Receiving Batch / Stock Baseline (Accordion Card) */}
                        {isEditing ? (
                            <div className="border border-gray-200/90 dark:border-slate-800 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/50 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-slate-800">
                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                                        Current Stock & Valuation
                                    </span>
                                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                        Aggregated from active batches
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">On Hand</p>
                                        <p className="text-xs font-bold font-mono text-gray-900 dark:text-slate-100 mt-0.5">
                                            {data.stock} {data.unit_of_issue || 'units'}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Unit Cost</p>
                                        <p className="text-xs font-bold font-mono text-gray-900 dark:text-slate-100 mt-0.5">
                                            ₱{Number(data.unit_cost || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Valuation</p>
                                        <p className="text-xs font-bold font-mono text-red-950 dark:text-red-400 mt-0.5">
                                            ₱{computedBatchTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs transition-all">
                                <button
                                    type="button"
                                    onClick={() => setIsBatchExpanded(!isBatchExpanded)}
                                    className="w-full px-4 py-3 bg-gray-50/70 dark:bg-slate-800/70 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors text-left cursor-pointer"
                                    aria-expanded={isBatchExpanded}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                                                Initial Receiving Batch
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 text-gray-500 dark:text-slate-400 bg-gray-200/70 dark:bg-slate-700 rounded">
                                                Optional
                                            </span>
                                            {Number(data.stock) > 0 && (
                                                <span className="text-[11px] font-semibold text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full font-mono">
                                                    {data.stock} units
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                            {isBatchExpanded
                                                ? 'Specify initial baseline stock and preferred vendor'
                                                : 'Click to record opening inventory or link a baseline vendor'}
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
                                    <div className="p-4 border-t border-gray-200/70 dark:border-slate-800 space-y-3.5 bg-white dark:bg-slate-900">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label htmlFor="inventory_supplier_id" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                                    styles={customSelectStyles}
                                                    isClearable
                                                    classNamePrefix="react-select"
                                                    isDisabled={processing}
                                                />
                                                {errors.supplier_id && (
                                                    <p id="inventory_supplier_id-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errors.supplier_id}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="inventory_supplier_stock_no" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                                        className={`w-full px-3 py-2 pr-8 bg-gray-50 dark:bg-slate-800/60 border rounded-lg text-xs font-mono font-medium text-gray-900 dark:text-slate-100 cursor-not-allowed ${
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
                                                    <p id="inventory_supplier_stock_no-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errors.supplier_stock_no}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label htmlFor="inventory_stock" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 ${
                                                        errors.stock ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errors.stock && (
                                                    <p id="inventory_stock-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errors.stock}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="inventory_unit_cost" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 ${
                                                        errors.unit_cost ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errors.unit_cost && (
                                                    <p id="inventory_unit_cost-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errors.unit_cost}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                                    Batch Total
                                                </label>
                                                <div className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-gray-900 dark:text-slate-100 flex items-center justify-between">
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

                    {/* Modal Footer Actions - Obvious Primary Action (Image 2 style) */}
                    <div className="px-5 py-3.5 bg-gray-50/80 dark:bg-slate-950/60 border-t border-gray-200/80 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none transition-colors disabled:opacity-50 text-center cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-6 py-2 text-xs font-semibold text-white bg-red-950 hover:bg-red-900 rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
