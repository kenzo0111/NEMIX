import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Select from 'react-select';
import { FileSpreadsheet, X, Plus, Trash2 } from 'lucide-react';
import Modal from '@/Components/Modal';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { getLocalDateString } from '@/utils/dateUtils';
import { FUND_CLUSTER_OPTIONS, FALLBACK_DIVISIONS } from '../../Issuance/constants';
import { DivisionGroup, RequestItem, SupplyRequest } from '../types';

type FormLine = { item_id: string; quantity: string };

interface RequestFormModalProps {
    show: boolean;
    request: SupplyRequest | null;
    items: RequestItem[];
    divisions?: DivisionGroup[];
    defaultRecipient?: string;
    defaultApprovedBy?: string;
    defaultApprovedByDesignation?: string;
    defaultIssuedBy?: string;
    defaultIssuedByDesignation?: string;
    onClose: () => void;
    onSaved: (message: string) => void;
}

export function RequestFormModal({
    show,
    request,
    items,
    divisions,
    defaultRecipient = '',
    defaultApprovedBy = 'ARSENIO GEM A. GARCILLANOSA',
    defaultApprovedByDesignation = 'SUPPLY OFFICER III/ADMIN OFFICER V',
    defaultIssuedBy = 'Supply Custodian / Storekeeper',
    defaultIssuedByDesignation = 'Administrative Aide VI / Storekeeper',
    onClose,
    onSaved,
}: RequestFormModalProps) {
    const divisionList = divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

    const form = useForm({
        recipient: '',
        date_requested: getLocalDateString(),
        department: '',
        recipient_designation: '',
        fund_cluster: '01',
        purpose: '',
        approved_by: defaultApprovedBy,
        approved_by_designation: defaultApprovedByDesignation,
        issued_by_name: defaultIssuedBy,
        issued_by_position: defaultIssuedByDesignation,
        items: [{ item_id: '', quantity: '' }] as FormLine[],
    });

    useEffect(() => {
        if (!show) return;

        if (request) {
            form.setData({
                recipient: request.recipient || request.requester?.name || defaultRecipient,
                date_requested: request.date_requested ? request.date_requested.slice(0, 10) : (request.created_at ? request.created_at.slice(0, 10) : getLocalDateString()),
                department: request.department || '',
                recipient_designation: request.recipient_designation || '',
                fund_cluster: request.fund_cluster || '01',
                purpose: request.purpose || '',
                approved_by: defaultApprovedBy,
                approved_by_designation: defaultApprovedByDesignation,
                issued_by_name: defaultIssuedBy,
                issued_by_position: defaultIssuedByDesignation,
                items: request.items && request.items.length > 0
                    ? request.items.map((line) => ({
                          item_id: String(line.item_id),
                          quantity: String(line.quantity),
                      }))
                    : [{ item_id: '', quantity: '' }],
            });
        } else {
            form.setData({
                recipient: defaultRecipient,
                date_requested: getLocalDateString(),
                department: '',
                recipient_designation: '',
                fund_cluster: '01',
                purpose: '',
                approved_by: defaultApprovedBy,
                approved_by_designation: defaultApprovedByDesignation,
                issued_by_name: defaultIssuedBy,
                issued_by_position: defaultIssuedByDesignation,
                items: [{ item_id: '', quantity: '' }],
            });
        }
        form.clearErrors();
    }, [show, request?.id, defaultRecipient, defaultApprovedBy, defaultApprovedByDesignation, defaultIssuedBy, defaultIssuedByDesignation]);

    // Selected division option for react-select
    const selectedDivisionOption = useMemo(() => {
        for (const group of divisionList) {
            const match = group.options.find((opt) => opt.value === form.data.department);
            if (match) return match;
        }
        return form.data.department ? { value: form.data.department, label: form.data.department } : null;
    }, [form.data.department, divisionList]);

    // Selected fund cluster option for react-select
    const selectedFundClusterOption = useMemo(() => {
        return (
            FUND_CLUSTER_OPTIONS.find(
                (opt) => opt.value === form.data.fund_cluster || opt.label === form.data.fund_cluster
            ) || FUND_CLUSTER_OPTIONS[0]
        );
    }, [form.data.fund_cluster]);

    // List of item IDs currently selected across all rows
    const selectedItemIds = useMemo(() => {
        return form.data.items
            .map((line) => Number(line.item_id))
            .filter((id) => !isNaN(id) && id > 0);
    }, [form.data.items]);

    const handleAddItem = () => {
        form.setData('items', [...form.data.items, { item_id: '', quantity: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (form.data.items.length > 1) {
            form.setData(
                'items',
                form.data.items.filter((_, i) => i !== index)
            );
        }
    };

    const handleChangeItem = (index: number, itemId: string) => {
        const next = [...form.data.items];
        next[index] = { ...next[index], item_id: itemId };
        form.setData('items', next);
    };

    const handleChangeQuantity = (index: number, quantity: string) => {
        const next = [...form.data.items];
        next[index] = { ...next[index], quantity };
        form.setData('items', next);
    };

    const handleModalClose = () => {
        if (!form.processing) {
            form.clearErrors();
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validRows = form.data.items.filter((line) => line.item_id && line.quantity);
        if (validRows.length === 0) {
            form.setError('items', 'Please add at least one item with a valid requested quantity.');
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
                onSaved(request ? 'Supply request updated successfully.' : 'Supply request submitted to the Property Custodian.');
            },
        };

        if (request) {
            form.put(route('inventory.requests.update', request.id), options);
        } else {
            form.post(route('inventory.requests.store'), options);
        }
    };

    return (
        <Modal
            show={show}
            onClose={handleModalClose}
            maxWidth="3xl"
            closeable={!form.processing}
            ariaLabel={request ? 'Edit Supply Request' : 'Create Supply Request'}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/75 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight truncate">
                                {request ? (request.ris_number ? `Edit Requisition (${request.ris_number})` : `Edit Supply Request #${request.id}`) : 'Create Supply Requisition (RIS)'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate">
                                Administrative Requisition & Issue Slip (RIS) Entry for Property Custodian Review
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleModalClose}
                        disabled={form.processing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs">
                    {/* SECTION 1: Recipient Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                1. Recipient Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="req_recipient" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Recipient Name <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <input
                                    id="req_recipient"
                                    name="recipient"
                                    type="text"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.recipient)}
                                    value={form.data.recipient}
                                    onChange={(e) => form.setData('recipient', e.target.value)}
                                    placeholder="Full name of requesting personnel"
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.recipient ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.recipient && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{form.errors.recipient}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_date_requested" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Date Requested <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <input
                                    id="req_date_requested"
                                    name="date_requested"
                                    type="date"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.date_requested)}
                                    value={form.data.date_requested}
                                    onChange={(e) => form.setData('date_requested', e.target.value)}
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-xs font-mono font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.date_requested ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.date_requested && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{form.errors.date_requested}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_department" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Division / Office <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <Select
                                    inputId="req_department"
                                    name="department"
                                    aria-label="Division or Office"
                                    aria-invalid={Boolean(form.errors.department)}
                                    value={selectedDivisionOption}
                                    onChange={(selected) => form.setData('department', selected?.value || '')}
                                    options={divisionList}
                                    placeholder="Select college, unit, or office..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.department))}
                                    classNamePrefix="react-select"
                                    isSearchable
                                />
                                {form.errors.department && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{form.errors.department}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_recipient_designation" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Recipient Designation
                                </label>
                                <input
                                    id="req_recipient_designation"
                                    name="recipient_designation"
                                    type="text"
                                    aria-invalid={Boolean(form.errors.recipient_designation)}
                                    value={form.data.recipient_designation}
                                    onChange={(e) => form.setData('recipient_designation', e.target.value)}
                                    placeholder="e.g. Dean, Department Head, Faculty, Coordinator"
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.recipient_designation ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.recipient_designation && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                        {form.errors.recipient_designation}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Accounting Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                2. Accounting Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="req_fund_cluster" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Fund Cluster
                                </label>
                                <Select
                                    inputId="req_fund_cluster"
                                    name="fund_cluster"
                                    aria-label="Fund Cluster"
                                    aria-invalid={Boolean(form.errors.fund_cluster)}
                                    value={selectedFundClusterOption}
                                    onChange={(selected) => form.setData('fund_cluster', selected?.value || '01')}
                                    options={FUND_CLUSTER_OPTIONS}
                                    placeholder="Select government fund cluster..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.fund_cluster))}
                                    classNamePrefix="react-select"
                                />
                                {form.errors.fund_cluster && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{form.errors.fund_cluster}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_purpose" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Purpose <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <input
                                    id="req_purpose"
                                    name="purpose"
                                    type="text"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.purpose)}
                                    value={form.data.purpose}
                                    onChange={(e) => form.setData('purpose', e.target.value)}
                                    placeholder="Purpose of supply requisition"
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.purpose ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.purpose && (
                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{form.errors.purpose}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Items Requested */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                3. Items Requested
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5 text-amber-500" />
                                + Add another item
                            </button>
                        </div>

                        {form.errors.items && (
                            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded text-xs text-red-700 dark:text-red-300 font-medium">
                                {form.errors.items}
                            </div>
                        )}

                        <div className="space-y-3">
                            {form.data.items.map((line, index) => {
                                const selectedItem = items.find((item) => item.id === Number(line.item_id));
                                const availableItemOptions = items
                                    .filter(
                                        (item) => item.id === selectedItem?.id || !selectedItemIds.includes(item.id)
                                    )
                                    .map((item) => ({
                                        value: String(item.id),
                                        label: `${item.name} (${item.sku}) — Stock: ${item.stock} ${item.unit_of_issue || 'pcs'}`,
                                    }));
                                const selectedOption = availableItemOptions.find((opt) => opt.value === line.item_id) || null;

                                const errorItem = form.errors[`items.${index}.item_id` as keyof typeof form.errors];
                                const errorQty = form.errors[`items.${index}.quantity` as keyof typeof form.errors];

                                return (
                                    <div
                                        key={index}
                                        className="p-3.5 bg-gray-50/70 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                            {/* Item selection */}
                                            <div className="flex-1 w-full min-w-0">
                                                <label
                                                    htmlFor={`req_item_${index}`}
                                                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1"
                                                >
                                                    Item #{index + 1} <span className="text-red-600">*</span>
                                                </label>
                                                <Select
                                                    inputId={`req_item_${index}`}
                                                    value={selectedOption}
                                                    onChange={(option) => handleChangeItem(index, option?.value || '')}
                                                    options={availableItemOptions}
                                                    placeholder="Search item by name or SKU..."
                                                    styles={getInstitutionalSelectStyles(Boolean(errorItem))}
                                                    classNamePrefix="react-select"
                                                    isClearable
                                                />
                                                {errorItem && (
                                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errorItem}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Available stock display */}
                                            <div className="w-full sm:w-36 shrink-0">
                                                <span className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                                    On-Hand Stock
                                                </span>
                                                <div className="h-10 px-3 flex items-center justify-between bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-gray-800 dark:text-slate-200">
                                                    <span>{selectedItem ? selectedItem.stock : '—'}</span>
                                                    <span className="text-[10px] text-gray-500 font-normal font-sans">
                                                        {selectedItem ? (selectedItem.unit_of_issue || 'pcs') : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity input */}
                                            <div className="w-full sm:w-28 shrink-0">
                                                <label
                                                    htmlFor={`req_qty_${index}`}
                                                    className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1"
                                                >
                                                    Qty <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    id={`req_qty_${index}`}
                                                    type="number"
                                                    min="1"
                                                    max="1000000"
                                                    required
                                                    value={line.quantity}
                                                    onChange={(e) => handleChangeQuantity(index, e.target.value)}
                                                    placeholder="Qty"
                                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-xs font-mono font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                                        errorQty ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errorQty && (
                                                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                                        {errorQty}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove row */}
                                            {form.data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="h-10 px-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center shrink-0"
                                                    title={`Remove item #${index + 1}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 4: Authorization (Signatories) */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">
                                4. Authorization (System Signatories)
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Approved By (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.approved_by}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Approved By Designation (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.approved_by_designation}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Issued By (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.issued_by_name}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Issued By Designation (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.issued_by_position}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            disabled={form.processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full sm:w-auto px-5 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-bold rounded-md shadow-xs disabled:opacity-50 uppercase font-mono tracking-wider cursor-pointer flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{request ? 'Save Changes' : 'Submit Supply Request'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
