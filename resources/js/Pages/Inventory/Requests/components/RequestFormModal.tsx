import React, { useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
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
    initialItemId?: number | null;
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
    initialItemId = null,
    divisions,
    defaultRecipient = '',
    defaultApprovedBy = 'ARSENIO GEM A. GARCILLANOSA',
    defaultApprovedByDesignation = 'SUPPLY OFFICER III/ADMIN OFFICER V',
    defaultIssuedBy = 'Supply Custodian / Storekeeper',
    defaultIssuedByDesignation = 'Administrative Aide VI / Storekeeper',
    onClose,
    onSaved,
}: RequestFormModalProps) {
    const pageProps = usePage().props as any;
    const requiresDocument = Boolean(pageProps.auth?.capabilities?.requiresSupportingDocument || request?.requires_supporting_document);
    const assignment = pageProps.departmentAssignment as { department: string | null; recipient: string | null; recipient_designation: string | null; ready: boolean } | null;
    const assignedUnit = Boolean(pageProps.auth?.capabilities?.coordinatorInventory);
    const assignmentMissing = assignedUnit && !request && !assignment?.ready;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const divisionList = divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

    const form = useForm({
        supporting_document: null as File | null,
        supporting_document_type: '',
        recipient: request?.recipient || (assignedUnit ? assignment?.recipient || '' : defaultRecipient),
        date_requested: getLocalDateString(),
        department: request?.department || (assignedUnit ? assignment?.department || '' : ''),
        recipient_designation: request?.recipient_designation || (assignedUnit ? assignment?.recipient_designation || '' : ''),
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
                supporting_document: null,
                supporting_document_type: request?.supporting_document_type || '',
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
                supporting_document: null,
                supporting_document_type: '',
                recipient: assignedUnit ? assignment?.recipient || '' : defaultRecipient,
                date_requested: getLocalDateString(),
                department: assignedUnit ? assignment?.department || '' : '',
                recipient_designation: assignedUnit ? assignment?.recipient_designation || '' : '',
                fund_cluster: '01',
                purpose: '',
                approved_by: defaultApprovedBy,
                approved_by_designation: defaultApprovedByDesignation,
                issued_by_name: defaultIssuedBy,
                issued_by_position: defaultIssuedByDesignation,
                items: [{ item_id: initialItemId && items.some(item => item.id === initialItemId && item.stock > 0) ? String(initialItemId) : '', quantity: '' }],
            });
        }
        form.clearErrors();
    }, [show, request?.id, initialItemId, defaultRecipient, defaultApprovedBy, defaultApprovedByDesignation, defaultIssuedBy, defaultIssuedByDesignation, assignment?.department, assignment?.recipient, assignment?.recipient_designation, assignedUnit]);

    useEffect(() => {
        if (!show || !form.data.supporting_document) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(form.data.supporting_document);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [show, form.data.supporting_document]);

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
        if (itemId && !items.some((item) => item.id === Number(itemId) && item.stock > 0)) return;
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
        if (assignmentMissing) return;

        if (requiresDocument && (!form.data.supporting_document_type || (!form.data.supporting_document && !request?.supporting_document_name))) {
            form.setError('supporting_document', 'Select a document type and upload an approved supporting document.');
            return;
        }
        const validRows = form.data.items.filter((line) => line.item_id && line.quantity);
        if (validRows.length === 0) {
            form.setError('items', 'Please add at least one item with a valid requested quantity.');
            return;
        }

        let hasUnavailableItem = false;
        form.data.items.forEach((line, index) => {
            if (line.item_id && !items.some((item) => item.id === Number(line.item_id) && item.stock > 0)) {
                form.setError(`items.${index}.item_id` as keyof typeof form.errors,
                    'This item is out of stock and unavailable for requisition. Select another item or remove this row.');
                hasUnavailableItem = true;
            }
        });
        if (hasUnavailableItem) return;

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
                onSaved(request ? 'Supply request updated successfully.' : 'Supply request submitted to the Property Custodian.');
            },
        };

        form.transform(data => data);
        if (!requiresDocument) form.transform(({ supporting_document, supporting_document_type, ...data }) => data);
        if (request && requiresDocument) {
            form.transform(data => ({ ...data, _method: 'put' }));
            form.post(route('inventory.requests.update', request.id), { ...options, forceFormData: true });
        } else if (request) {
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 font-sans tracking-tight truncate">
                                {request ? (request.ris_number ? `Edit Requisition (${request.ris_number})` : `Edit Supply Request #${request.id}`) : 'Create Supply Requisition (RIS)'}
                            </h3>
                            <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 font-medium truncate">
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
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6 text-sm">
                    {assignedUnit && <div className={`rounded-lg border p-3 text-sm ${assignmentMissing ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                        {assignmentMissing ? 'Ask an administrator to assign your Delivery Unit and an active office head with a designation in Staff Accounts before submitting a request.' : 'Department and Requested by details come from your administrator-assigned Delivery Unit. Your coordinator account is recorded as the submitter.'}
                    </div>}
                    {/* SECTION 1: Recipient Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-base font-bold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                1. Requesting Office
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="req_recipient" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    {assignedUnit ? 'Requested by (Department / Office Head)' : 'Recipient Name'} <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <input
                                    id="req_recipient"
                                    name="recipient"
                                    type="text"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.recipient)}
                                    readOnly={assignedUnit}
                                    value={form.data.recipient}
                                    onChange={(e) => form.setData('recipient', e.target.value)}
                                    placeholder="Full name of requesting personnel"
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.recipient ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.recipient && (
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.recipient}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_date_requested" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.date_requested ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.date_requested && (
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.date_requested}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_department" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Division / Office <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <Select
                                    isDisabled={assignedUnit}
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
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.department}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_recipient_designation" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    {assignedUnit ? 'Office Head Designation' : 'Recipient Designation'}
                                </label>
                                <input
                                    id="req_recipient_designation"
                                    name="recipient_designation"
                                    type="text"
                                    aria-invalid={Boolean(form.errors.recipient_designation)}
                                    readOnly={assignedUnit}
                                    value={form.data.recipient_designation}
                                    onChange={(e) => form.setData('recipient_designation', e.target.value)}
                                    placeholder="e.g. Dean, Department Head, Faculty, Coordinator"
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.recipient_designation ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.recipient_designation && (
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                        {form.errors.recipient_designation}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Accounting Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800">
                            <h4 className="text-base font-bold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                2. Accounting Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="req_fund_cluster" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.fund_cluster}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="req_purpose" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
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
                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                        form.errors.purpose ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                    }`}
                                />
                                {form.errors.purpose && (
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.purpose}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Items Requested */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-base font-bold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                3. Items Requested
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-sm flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5 text-amber-500" />
                                + Add another item
                            </button>
                        </div>

                        {form.errors.items && (
                            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded text-sm text-red-700 dark:text-red-300 font-medium">
                                {form.errors.items}
                            </div>
                        )}

                        <div className="space-y-3">
                            {form.data.items.map((line, index) => {
                                const selectedItem = items.find((item) => item.id === Number(line.item_id))
                                    || request?.items.find((entry) => entry.item_id === Number(line.item_id))?.item;
                                const unavailable = Boolean(line.item_id) && !items.some((item) => item.id === Number(line.item_id) && item.stock > 0);
                                const availableItemOptions = items
                                    .filter(
                                        (item) => item.stock > 0 && (item.id === selectedItem?.id || !selectedItemIds.includes(item.id))
                                    )
                                    .map((item) => ({
                                        value: String(item.id),
                                        label: `${item.name} (${item.sku}) — Stock: ${item.stock} ${item.unit_of_issue || 'pcs'}`,
                                    }));
                                const selectedOption = availableItemOptions.find((opt) => opt.value === line.item_id)
                                    || (unavailable ? { value: line.item_id, label: `${selectedItem?.name || 'Previously selected item'} — Unserviceable (Out of stock)` } : null);

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
                                                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1"
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
                                                    noOptionsMessage={() => 'No in-stock items available'}
                                                />
                                                {unavailable && (
                                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        Unserviceable for requisition: out of stock. Remove this item or select another.
                                                    </p>
                                                )}
                                                {errorItem && (
                                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errorItem}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Available stock display */}
                                            <div className="w-full sm:w-36 shrink-0">
                                                <span className="block text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                                    On-Hand Stock
                                                </span>
                                                <div className="h-10 px-3 flex items-center justify-between bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-md text-sm tabular-nums font-bold text-gray-800 dark:text-slate-200">
                                                    <span>{selectedItem ? selectedItem.stock : '—'}</span>
                                                    <span className="text-sm text-gray-500 font-normal font-sans">
                                                        {selectedItem ? (selectedItem.unit_of_issue || 'pcs') : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity input */}
                                            <div className="w-full sm:w-28 shrink-0">
                                                <label
                                                    htmlFor={`req_qty_${index}`}
                                                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1"
                                                >
                                                    Qty <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    id={`req_qty_${index}`}
                                                    type="number"
                                                    min="1"
                                                    max="1000000"
                                                    required
                                                    disabled={unavailable}
                                                    value={line.quantity}
                                                    onChange={(e) => handleChangeQuantity(index, e.target.value)}
                                                    placeholder="Qty"
                                                    className={`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-2xs ${
                                                        errorQty ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                                                    }`}
                                                />
                                                {errorQty && (
                                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
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
                            <h4 className="text-base font-bold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                4. Authorization (System Signatories)
                            </h4>
                        </div>
                        <div className="space-y-4">
                            {/* Approved By Row */}
                            <div>
                                <span className="block text-sm font-bold normal-case tracking-normal text-gray-500 dark:text-slate-400 mb-2 tabular-nums">
                                    Approved By (Section B)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Name (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.approved_by}
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Designation (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.approved_by_designation}
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Approved Date (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                request?.reviewed_at
                                                    ? request.reviewed_at.slice(0, 10)
                                                    : (request?.status === 'Approved' || request?.status === 'Issued'
                                                        ? (request.date_requested ? request.date_requested.slice(0, 10) : getLocalDateString())
                                                        : 'Pending Custodian Approval')
                                            }
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Issued By Row */}
                            <div>
                                <span className="block text-sm font-bold normal-case tracking-normal text-gray-500 dark:text-slate-400 mb-2 tabular-nums">
                                    Issued By (Section C)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Name (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.issued_by_name}
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Designation (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.issued_by_position}
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Issued Date (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                request?.issuance?.date_issued
                                                    ? request.issuance.date_issued.slice(0, 10)
                                                    : (request?.status === 'Issued'
                                                        ? (request.date_requested ? request.date_requested.slice(0, 10) : getLocalDateString())
                                                        : 'Pending Item Release')
                                            }
                                            readOnly
                                            className="w-full h-10 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-gray-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {requiresDocument && <section className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                        <h4 className="font-semibold">Supporting Document</h4>
                        <p className="text-sm text-slate-500">An approved supporting document is required before submission. This is proof of authorization, separate from the RIS. PDF, JPG, JPEG, or PNG, up to 10 MB.</p>
                        <label className="block text-sm font-medium">Document type
                            <select required value={form.data.supporting_document_type} onChange={e => form.setData('supporting_document_type', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-900">
                                <option value="">Select document type</option>
                                {['Approved MOA', 'Approved Research', 'Approved Letter', 'Others'].map(type => <option key={type}>{type}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm font-medium">Upload Approved Supporting Document
                            <input key={`${request?.id || 'new'}-${show}`} type="file" accept=".pdf,.jpg,.jpeg,.png" required={!request?.supporting_document_name && !form.data.supporting_document} onChange={e => {
                                const file = e.target.files?.[0] || null;
                                form.clearErrors('supporting_document');
                                if (file && (!/\.(pdf|jpe?g|png)$/i.test(file.name) || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
                                    form.setData('supporting_document', null);
                                    form.setError('supporting_document', 'Choose a PDF, JPG, JPEG, or PNG file no larger than 10 MB.');
                                    e.target.value = '';
                                    return;
                                }
                                form.setData('supporting_document', file);
                            }} className="mt-2 block w-full text-sm" />
                        </label>
                        {form.errors.supporting_document_type && <p role="alert" className="text-sm text-red-600">{form.errors.supporting_document_type}</p>}
                        {form.errors.supporting_document && <p role="alert" className="text-sm text-red-600">{form.errors.supporting_document}</p>}
                        {form.data.supporting_document && <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span>{form.data.supporting_document.name}</span>
                            {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-900 dark:text-red-300">Preview</a>}
                            <button type="button" onClick={() => { form.setData('supporting_document', null); const input = document.querySelector<HTMLInputElement>('input[type="file"]'); if (input) input.value = ''; }} className="font-semibold text-red-900 dark:text-red-300">Remove selection</button>
                        </div>}
                        {!form.data.supporting_document && request?.supporting_document_name && <p className="text-sm">Current: <a className="underline" href={route('inventory.requests.document', { supplyRequest: request.id, inline: 1 })} target="_blank" rel="noopener noreferrer">{request.supporting_document_name}</a>. Select a file to replace it.</p>}
                    </section>}
                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            disabled={form.processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || assignmentMissing}
                            className="w-full sm:w-auto px-5 py-2 bg-red-950 hover:bg-red-900 text-white text-sm font-bold rounded-md shadow-xs disabled:opacity-50 normal-case tabular-nums tracking-normal cursor-pointer flex items-center justify-center gap-2"
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
