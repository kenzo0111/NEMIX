import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import useValidationFocus from '@/Hooks/useValidationFocus';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Select from 'react-select';
import { FileSpreadsheet, X, Plus, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import Modal from '@/Components/Modal';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { getLocalDateString } from '@/utils/dateUtils';
import { FUND_CLUSTER_OPTIONS, FALLBACK_DIVISIONS } from '../../Issuance/constants';
import { DivisionGroup, RequestItem, SupplyRequest } from '../types';

export const SUPPORTING_DOCUMENT_TYPE_OPTIONS = [
    { value: 'Approved MOA', label: 'Approved MOA' },
    { value: 'Approved Research', label: 'Approved Research' },
    { value: 'Approved Letter', label: 'Approved Letter' },
    { value: 'Specify Other', label: 'Specify Other' },
];

type FormLine = { item_id: string; quantity: string };

interface RequestFormModalProps {
    show: boolean;
    request: SupplyRequest | null;
    items: RequestItem[];
    preRequestableItems?: RequestItem[];
    initialMode?: 'requisition' | 'pre_request';
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
    preRequestableItems,
    initialMode = 'requisition',
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
    const minimumStockThreshold = Number(pageProps.minimumStockThreshold ?? 10);
    const sharedRoles = pageProps.auth?.roles || pageProps.auth?.user?.roles;
    const roleNames: string[] = Array.isArray(sharedRoles) ? sharedRoles : [];
    const isAuthorizedPersonnel = roleNames.some((role) => String(role).toLowerCase() === 'authorized personnel');
    const requiresDocument = Boolean(
        pageProps.auth?.capabilities?.requiresSupportingDocument ||
        isAuthorizedPersonnel ||
        request?.requires_supporting_document
    );
    const assignment = pageProps.departmentAssignment as { department: string | null; recipient: string | null; recipient_designation: string | null; ready: boolean } | null;
    const assignedUnit = Boolean(pageProps.auth?.capabilities?.coordinatorInventory);
    const loginUserName = pageProps.auth?.user?.name || defaultRecipient;
    const loginUserDesignation = pageProps.auth?.user?.designation || assignment?.recipient_designation || '';
    const departmentLocked = assignedUnit && (!isAuthorizedPersonnel || Boolean(assignment?.department));
    const assignmentMissing = assignedUnit && !isAuthorizedPersonnel && !request && !assignment?.ready;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [otherDocumentSpecification, setOtherDocumentSpecification] = useState('');
    const divisionList = divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

    const initialType = (initialMode || (request?.status === 'Pre-Requested' ? 'pre_request' : 'requisition')) as 'requisition' | 'pre_request';
    const form = useForm({
        submission_key: globalThis.crypto?.randomUUID?.(),
        supporting_document: null as File | null,
        supporting_document_type: '',
        recipient: isAuthorizedPersonnel ? loginUserName : (request?.recipient || (assignedUnit ? assignment?.recipient || '' : defaultRecipient)),
        date_requested: getLocalDateString(),
        department: request?.department || (assignedUnit ? assignment?.department || '' : ''),
        recipient_designation: request?.recipient_designation || (isAuthorizedPersonnel ? loginUserDesignation : (assignedUnit ? assignment?.recipient_designation || '' : '')),
        fund_cluster: '01',
        purpose: '',
        request_type: initialType,
        approved_by: defaultApprovedBy,
        approved_by_designation: defaultApprovedByDesignation,
        issued_by_name: defaultIssuedBy,
        issued_by_position: defaultIssuedByDesignation,
        items: (request?.items && request.items.length > 0
            ? request.items.map((line) => ({ item_id: String(line.item_id), quantity: String(line.quantity) }))
            : [{ item_id: initialItemId ? String(initialItemId) : '', quantity: '' }]) as FormLine[],
    });

    useValidationFocus(form.errors);

    const isPreRequest = form.data.request_type === 'pre_request';
    const isRestocked = request?.status === 'Stock Restocked';
    const activeCatalogItems = useMemo(() => {
        if (isPreRequest && preRequestableItems && preRequestableItems.length > 0) {
            return preRequestableItems;
        }
        return items;
    }, [isPreRequest, preRequestableItems, items]);

    const findItemById = (itemId: string | number) => {
        const id = Number(itemId);
        if (!id) return null;
        return activeCatalogItems.find((item) => item.id === id)
            || preRequestableItems?.find((item) => item.id === id)
            || items.find((item) => item.id === id)
            || request?.items?.find((entry) => entry.item_id === id)?.item
            || null;
    };

    const maximumQuantity = (item: RequestItem) => isPreRequest ? 10000 : Math.min(
        1000000, Math.max(0, request?.items?.find(line => line.item_id === item.id)?.max_request_quantity ?? item.max_request_quantity ?? item.stock)
    );
    const requestableItems = useMemo(
        () => isPreRequest ? activeCatalogItems : activeCatalogItems.filter((item) => maximumQuantity(item) > 0),
        [isPreRequest, activeCatalogItems, request]
    );
    const quantityLimitMessage = (item: RequestItem) =>
        `Request at most ${maximumQuantity(item)} ${item.unit_of_issue || 'units'} based on available warehouse stock and your weekly allowance. Approved quantities are already deducted.`;

    const isModalOpen = useRef(false);
    const editingRequestId = useRef<number | null | undefined>(undefined);

    useEffect(() => {
        if (!show) {
            isModalOpen.current = false;
            editingRequestId.current = undefined;
            return;
        }

        const isNewlyOpened = !isModalOpen.current;
        const isDifferentRequest = request?.id !== editingRequestId.current;

        if (!isNewlyOpened && !isDifferentRequest) {
            return;
        }

        isModalOpen.current = true;
        editingRequestId.current = request?.id;

        if (request) {
            const initialDocType = request?.supporting_document_type || '';
            const isOther = initialDocType === 'Others' || initialDocType === 'Specify Other' || /^(Specify Other|Others):\s*/i.test(initialDocType);
            const extractedCustomText = isOther ? initialDocType.replace(/^(Specify Other|Others):\s*/i, '') : '';
            setOtherDocumentSpecification(extractedCustomText);

            const initialType = request.status === 'Stock Restocked'
                ? 'requisition'
                : (request.status === 'Pre-Requested' || request.request_type === 'pre_request' ? 'pre_request' : 'requisition');

            form.setData({
                submission_key: undefined,
                supporting_document: null,
                supporting_document_type: request?.supporting_document_type || '',
                recipient: isAuthorizedPersonnel ? loginUserName : (request.recipient || request.requester?.name || defaultRecipient),
                date_requested: request.date_requested ? request.date_requested.slice(0, 10) : (request.created_at ? request.created_at.slice(0, 10) : getLocalDateString()),
                department: request.department || '',
                recipient_designation: request.recipient_designation || (isAuthorizedPersonnel ? loginUserDesignation : ''),
                fund_cluster: request.fund_cluster || '01',
                purpose: request.purpose || '',
                request_type: initialType,
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
            setOtherDocumentSpecification('');
            const targetType = initialMode || 'requisition';

            form.setData({
                submission_key: globalThis.crypto?.randomUUID?.(),
                supporting_document: null,
                supporting_document_type: '',
                recipient: isAuthorizedPersonnel ? loginUserName : (assignedUnit ? assignment?.recipient || '' : defaultRecipient),
                date_requested: getLocalDateString(),
                department: assignedUnit ? assignment?.department || '' : '',
                recipient_designation: isAuthorizedPersonnel ? loginUserDesignation : (assignedUnit ? assignment?.recipient_designation || '' : ''),
                fund_cluster: '01',
                purpose: '',
                request_type: targetType,
                approved_by: defaultApprovedBy,
                approved_by_designation: defaultApprovedByDesignation,
                issued_by_name: defaultIssuedBy,
                issued_by_position: defaultIssuedByDesignation,
                items: [{ item_id: initialItemId ? String(initialItemId) : '', quantity: '' }],
            });
        }
        form.clearErrors();
    }, [show, request?.id, initialMode, initialItemId]);

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

    // Whether currently set to Specify Other
    const isSpecifyOther = useMemo(() => {
        const type = form.data.supporting_document_type || '';
        return type === 'Others' || type === 'Specify Other' || /^(Specify Other|Others):\s*/i.test(type);
    }, [form.data.supporting_document_type]);

    // Selected supporting document type option for react-select
    const selectedDocumentTypeOption = useMemo(() => {
        if (!form.data.supporting_document_type) return null;
        if (isSpecifyOther) {
            return { value: 'Specify Other', label: 'Specify Other' };
        }
        return (
            SUPPORTING_DOCUMENT_TYPE_OPTIONS.find(
                (opt) => opt.value === form.data.supporting_document_type || opt.label === form.data.supporting_document_type
            ) || { value: form.data.supporting_document_type, label: form.data.supporting_document_type }
        );
    }, [form.data.supporting_document_type, isSpecifyOther]);

    // List of item IDs currently selected across all rows
    const selectedItemIds = useMemo(() => {
        return form.data.items
            .map((line) => Number(line.item_id))
            .filter((id) => !isNaN(id) && id > 0);
    }, [form.data.items]);

    const stockErrors = form.data.items.map((line) => {
        if (isPreRequest) {
            return {
                item: null,
                quantity: line.quantity && (Number(line.quantity) <= 0 || Number(line.quantity) > 10000)
                    ? 'Enter a valid replenishment quantity between 1 and 10,000 units.'
                    : null,
            };
        }
        const item = requestableItems.find((item) => item.id === Number(line.item_id));
        const selectedItem = findItemById(line.item_id);
        const outOfStock = !selectedItem || selectedItem.stock <= 0;
        const remainingQuota = request?.items?.find(entry => entry.item_id === Number(line.item_id))?.quota_remaining ?? selectedItem?.quota_remaining;
        const quotaMessage = selectedItem?.weekly_request_limit === null
            ? 'Weekly limit not configured. Contact Inventory Staff before requesting this item.'
            : remainingQuota === 0
                ? 'Your weekly allowance for this item is used. Remove this item or select another.'
                : null;
        return {
            item: line.item_id && !item
                ? (quotaMessage ?? (outOfStock
                    ? 'Unserviceable for requisition: out of stock. Remove this item or select another.'
                    : 'Unavailable for requisition: no stock currently available to request due to approved reservations. Remove this item or select another.'))
                : null,
            quantity: item && Number(line.quantity) > maximumQuantity(item)
                ? quantityLimitMessage(item)
                : null,
        };
    });
    const hasStockError = stockErrors.some((errors) => errors.item || errors.quantity);

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
        if (itemId && !requestableItems.some((item) => item.id === Number(itemId)) && !activeCatalogItems.some((item) => item.id === Number(itemId))) return;
        const next = [...form.data.items];
        next[index] = { ...next[index], item_id: itemId };
        form.setData('items', next);
        form.clearErrors(`items.${index}.item_id` as keyof typeof form.errors, `items.${index}.quantity` as keyof typeof form.errors);
    };

    const handleChangeQuantity = (index: number, quantity: string) => {
        const next = [...form.data.items];
        next[index] = { ...next[index], quantity };
        form.setData('items', next);
        form.clearErrors(`items.${index}.quantity` as keyof typeof form.errors);
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

        if (requiresDocument) {
            if (!form.data.supporting_document_type || (isSpecifyOther && !otherDocumentSpecification.trim())) {
                form.setError('supporting_document_type', isSpecifyOther && !otherDocumentSpecification.trim()
                    ? 'Please specify the other document type.'
                    : 'Select a document type.');
                return;
            }
            if (!form.data.supporting_document && !request?.supporting_document_name) {
                form.setError('supporting_document', 'Upload an approved supporting document.');
                return;
            }
        }
        const validRows = form.data.items.filter((line) => line.item_id && line.quantity);
        if (validRows.length === 0) {
            form.setError('items', 'Please add at least one item with a valid requested quantity.');
            return;
        }

        stockErrors.forEach((errors, index) => {
            if (errors.item) form.setError(`items.${index}.item_id` as keyof typeof form.errors, errors.item);
            if (errors.quantity) form.setError(`items.${index}.quantity` as keyof typeof form.errors, errors.quantity);
        });
        if (hasStockError) return;

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
            ariaLabel={isRestocked ? 'Complete Restocked Requisition' : isPreRequest ? (request ? 'Edit Pre-Request' : 'Create Multi-Item Pre-Request') : (request ? 'Edit Supply Request' : 'Create Supply Request')}
        >
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Header */}
            <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                        {isRestocked ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : isPreRequest ? (
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                            <FileSpreadsheet className="w-5 h-5 text-red-900 dark:text-red-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            {isRestocked
                                ? `Stock Restocked · Complete Requisition (${request?.ris_number || `#${request?.id}`})`
                                : isPreRequest
                                    ? (request ? `Edit Pre-Request #${request.id}` : 'Create Multi-Item Pre-Request')
                                    : (request ? (request.ris_number ? `Edit Requisition (${request.ris_number})` : `Edit Supply Request #${request.id}`) : 'Create Supply Requisition (RIS)')}
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium break-words">
                            {isRestocked
                                ? 'Supplies have arrived and have been restocked by Central Supply. Review line items and submit your official requisition.'
                                : isPreRequest
                                    ? 'Submit demand for out-of-stock items so the Supply Office can prioritize restock and notify you when available.'
                                    : 'Administrative Requisition & Issue Slip (RIS) Entry for Property Custodian Review'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={handleModalClose}
                    disabled={form.processing}
                    className="shrink-0 ml-2"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <DialogBody className="space-y-6 text-sm">
                    {!request && (
                        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <Button aria-pressed={!isPreRequest} variant="tab"
                                type="button"
                                onClick={() => form.setData('request_type', 'requisition')}
                                className={`flex-1 py-2 px-3 text-sm sm:text-sm font-semibold rounded-lg transition-all ${!isPreRequest
    ? "bg-white dark:bg-slate-900 text-red-950 dark:text-red-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                            >
                                Standard Requisition (In-Stock)
                            </Button>
                            <Button aria-pressed={isPreRequest} variant="tab"
                                type="button"
                                onClick={() => form.setData('request_type', 'pre_request')}
                                className={`flex-1 py-2 px-3 text-sm sm:text-sm font-semibold rounded-lg transition-all ${isPreRequest
    ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                            >
                                Pre-Request (Out-of-Stock Supplies)
                            </Button>
                        </div>
                    )}

                    {isRestocked && (
                        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <h5 className="font-semibold text-sm">Supplies Restocked & Ready for Requisition</h5>
                                <p className="mt-1 text-sm leading-relaxed text-emerald-800 dark:text-emerald-300">
                                    Central Supply has received and verified shipment for these requested items. You can now confirm the quantities below and submit your official requisition to the Property Custodian.
                                </p>
                            </div>
                        </div>
                    )}

                    {isPreRequest && !isRestocked && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5 text-sm leading-relaxed">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <strong>Multi-Item Pre-Request Mode:</strong> Select out-of-stock items your delivery unit requires. This ticket will be tracked under <em>My Requests</em> with status <strong>Pre-Requested</strong>. Once Central Supply receives these items into inventory, your ticket status will automatically update to <strong>Stock Restocked</strong>.
                            </div>
                        </div>
                    )}

                    {assignedUnit && <div className={`rounded-lg border p-3 text-sm ${assignmentMissing ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                        {assignmentMissing ? 'Ask an administrator to assign your Delivery Unit and an active office head with a designation in Staff Accounts before submitting a request.' : isAuthorizedPersonnel ? 'Your name is shown as the requester. Delivery Unit assignment is optional; choose a Division / Office if none is assigned.' : 'Department and Requested by details come from your administrator-assigned Delivery Unit. Your coordinator account is recorded as the submitter.'}
                    </div>}
                    {/* SECTION 1: Recipient Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                1. Requesting Office
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field id="req_recipient" label={<>
                                    {isAuthorizedPersonnel ? 'Requested by' : assignedUnit ? 'Requested by (Department / Office Head)' : 'Recipient Name'} <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </>} error={form.errors.recipient} ><input
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
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.recipient ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>

                            <Field id="req_date_requested" label={<>
                                    Date Requested <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </>} error={form.errors.date_requested} ><input
                                    id="req_date_requested"
                                    name="date_requested"
                                    type="date"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.date_requested)}
                                    value={form.data.date_requested}
                                    onChange={(e) => form.setData('date_requested', e.target.value)}
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.date_requested ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>

                            <Field id="req_department" label={<>
                                    Division / Office <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </>} error={form.errors.department} ><Select
                                    isDisabled={departmentLocked}
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
                                /></Field>

                            <Field id="req_recipient_designation" label={<>
                                    {assignedUnit && !isAuthorizedPersonnel ? 'Office Head Designation' : 'Recipient Designation'}
                                </>} error={form.errors.recipient_designation} ><input
                                    id="req_recipient_designation"
                                    name="recipient_designation"
                                    type="text"
                                    aria-invalid={Boolean(form.errors.recipient_designation)}
                                    readOnly={assignedUnit && !isAuthorizedPersonnel}
                                    value={form.data.recipient_designation}
                                    onChange={(e) => form.setData('recipient_designation', e.target.value)}
                                    placeholder="e.g. Dean, Department Head, Faculty, Coordinator"
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.recipient_designation ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>
                        </div>
                    </div>

                    {/* SECTION 2: Accounting Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                2. Accounting Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field id="req_fund_cluster" label={<>
                                    Fund Cluster
                                </>} error={form.errors.fund_cluster} ><Select
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
                                /></Field>

                            <div>
                                <label htmlFor="req_purpose" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Purpose <span className="text-red-600 dark:text-red-300" aria-hidden="true">*</span>
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
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.purpose ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                />
                                {form.errors.purpose && (
                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{form.errors.purpose}</p>
                                )}

                                {/* Urgency Priority Checkbox (Inspired by COMPASS) */}
                                <div className="mt-3 p-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
                                    <div className="flex items-start gap-3">
                                        <input
                                            id="req_urgent_toggle"
                                            type="checkbox"
                                            checked={form.data.purpose.startsWith('[URGENT] ')}
                                            onChange={(e) => {
                                                const isUrgent = e.target.checked;
                                                const clean = form.data.purpose.replace(/^\[URGENT\]\s*/i, '');
                                                form.setData('purpose', isUrgent ? `[URGENT] ${clean}` : clean);
                                            }}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-900 focus:ring-red-900 dark:border-slate-700 dark:bg-slate-900 cursor-pointer dark:text-red-300"
                                        />
                                        <div className="text-sm">
                                            <label htmlFor="req_urgent_toggle" className="font-semibold text-red-950 dark:text-red-300 cursor-pointer flex items-center gap-1.5">
                                                ⚡ This requisition is urgent
                                            </label>
                                            <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                Mark this if the department or office urgently requires these supplies for immediate operations, exams, or official events. Urgent requests are prioritized at the top of the SPMO queue.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Items Requested */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                3. Items Requested
                            </h4>
                            <Button variant="secondary"
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                Add another item
                            </Button>
                        </div>

                        {form.errors.items && (
                            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded text-sm text-red-700 dark:text-red-300 font-medium">
                                {form.errors.items}
                            </div>
                        )}

                        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                            Requisitions are subject to available warehouse stock and your weekly item allowance. Approved quantities are deducted immediately.
                        </p>
                        <div className="space-y-3">
                            {form.data.items.map((line, index) => {
                                const selectedItem = findItemById(line.item_id);
                                const unavailable = Boolean(stockErrors[index].item);
                                const maxQuantity = selectedItem && !unavailable ? maximumQuantity(selectedItem) : 0;
                                const availableItemOptions = requestableItems
                                    .filter(
                                        (item) => item.id === selectedItem?.id || !selectedItemIds.includes(item.id)
                                    )
                                    .map((item) => ({
                                        value: String(item.id),
                                        label: isPreRequest
                                            ? `${item.name} (${item.sku}) · Stock: ${item.stock} ${item.unit_of_issue || 'pcs'}${item.stock <= 0 ? ' [Out of Stock]' : ''}`
                                            : `${item.name} (${item.sku}) — Stock: ${item.stock} ${item.unit_of_issue || 'pcs'} · Max request: ${maximumQuantity(item)}`,
                                    }));
                                const selectedOption = availableItemOptions.find((opt) => opt.value === line.item_id)
                                    || (selectedItem ? {
                                        value: String(selectedItem.id),
                                        label: isPreRequest
                                            ? `${selectedItem.name} (${selectedItem.sku}) · Stock: ${selectedItem.stock} ${selectedItem.unit_of_issue || 'pcs'}${selectedItem.stock <= 0 ? ' [Out of Stock]' : ''}`
                                            : `${selectedItem.name} (${selectedItem.sku}) — Stock: ${selectedItem.stock} ${selectedItem.unit_of_issue || 'pcs'} · Max request: ${maximumQuantity(selectedItem)}`
                                    } : null)
                                    || (unavailable ? { value: line.item_id, label: `${selectedItem?.name || 'Previously selected item'} — ${!selectedItem || selectedItem.stock <= 0 ? 'Unserviceable (Out of stock)' : 'Unavailable to request'}` } : null);

                                const errorItem = stockErrors[index].item || form.errors[`items.${index}.item_id` as keyof typeof form.errors];
                                const errorQty = stockErrors[index].quantity || form.errors[`items.${index}.quantity` as keyof typeof form.errors];

                                return (
                                    <div
                                        key={index}
                                        className="p-3.5 bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                            {/* Item selection */}
                                            <div className="flex-1 w-full min-w-0">
                                                <label
                                                    htmlFor={`req_item_${index}`}
                                                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                                                >
                                                    Item #{index + 1} <span className="text-red-600 dark:text-red-300">*</span>
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
                                                    noOptionsMessage={() => 'No items available within stock and weekly limits'}
                                                />
                                                {errorItem && (
                                                    <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        {errorItem}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Available stock display */}
                                            <div className="w-full sm:w-36 shrink-0">
                                                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                                    On-Hand Stock
                                                </span>
                                                <div className="h-10 px-3 flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                                                    <span>{selectedItem ? selectedItem.stock : '—'}</span>
                                                    <span className="text-sm text-slate-500 font-normal font-sans dark:text-slate-300">
                                                        {selectedItem ? (selectedItem.unit_of_issue || 'pcs') : ''}
                                                    </span>
                                                </div>
                                                {selectedItem && <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Weekly limit: {selectedItem.weekly_request_limit ?? 'Not configured'} · Remaining: {request?.items?.find(line => line.item_id === selectedItem.id)?.quota_remaining ?? selectedItem.quota_remaining ?? '—'}</p>}
                                            </div>

                                            {/* Quantity input */}
                                            <div className="w-full sm:w-28 shrink-0">
                                                <label
                                                    htmlFor={`req_qty_${index}`}
                                                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                                                >
                                                    Qty <span className="text-red-600 dark:text-red-300">*</span>
                                                </label>
                                                <input
                                                    id={`req_qty_${index}`}
                                                    type="number"
                                                    min="1"
                                                    max={isPreRequest ? 10000 : (selectedItem ? maxQuantity : 1000000)}
                                                    required
                                                    disabled={unavailable}
                                                    aria-invalid={Boolean(errorQty)}
                                                    aria-describedby={errorQty ? `req_qty_error_${index}` : selectedItem && !unavailable ? `req_qty_help_${index}` : undefined}
                                                    value={line.quantity}
                                                    onChange={(e) => handleChangeQuantity(index, e.target.value)}
                                                    placeholder="Qty"
                                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${errorQty ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                                />
                                            </div>

                                            {/* Remove row */}
                                            {form.data.items.length > 1 && (
                                                <Button variant="secondary" size="icon"
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="h-10 flex items-center justify-center shrink-0"
                                                    title={`Remove item #${index + 1}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {errorQty && (
                                            <p id={`req_qty_error_${index}`} role="alert" className="leading-relaxed mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                                {errorQty}
                                            </p>
                                        )}
                                        {selectedItem && !unavailable && !errorQty && (
                                            <p id={`req_qty_help_${index}`} className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                {isPreRequest ? 'Pre-request demand quantity up to 10,000 units.' : `Maximum request: ${maxQuantity} ${selectedItem.unit_of_issue || 'units'}.`}
                                            </p>
                                        )}
                                        {selectedItem && !unavailable && (Number(selectedItem.stock) <= minimumStockThreshold || (Number(line.quantity) > 0 && Number(selectedItem.stock) - Number(line.quantity) <= minimumStockThreshold)) && (
                                            <div className="mt-2.5 p-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded text-sm text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                <span>
                                                    <strong>Notice:</strong> This item {Number(selectedItem.stock) <= minimumStockThreshold ? `has met the low-stock replenishment threshold (${minimumStockThreshold} ${selectedItem.unit_of_issue || 'units'})` : `will meet or drop below the replenishment threshold (${minimumStockThreshold} ${selectedItem.unit_of_issue || 'units'}) after this request`}. You may proceed with your request; the Supply Office has been notified to replenish stock.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 4: Authorization (Signatories) */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                4. Authorization (System Signatories)
                            </h4>
                        </div>
                        <div className="space-y-4">
                            {/* Approved By Row */}
                            <div>
                                <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 dark:text-slate-400 mb-2 tabular-nums">
                                    Approved By (Section B)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Name (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.approved_by}
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Designation (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.approved_by_designation}
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Approved Date (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                request?.reviewed_at
                                                    ? request.reviewed_at.slice(0, 10)
                                                    : (request?.status === 'Approved' || request?.status === 'Issued'
                                                        ? (request.date_requested ? request.date_requested.slice(0, 10) : getLocalDateString())
                                                        : 'Pending Head of Office Approval')
                                            }
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Issued By Row */}
                            <div>
                                <span className="block text-sm font-semibold normal-case tracking-normal text-slate-500 dark:text-slate-400 mb-2 tabular-nums">
                                    Issued By (Section C)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Name (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.issued_by_name}
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Designation (Read-Only)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.issued_by_position}
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {requiresDocument && <section data-tour="authorized-personnel-supporting-document" className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 bg-white dark:bg-slate-900/40">
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Supporting Document</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">An approved supporting document is required before submission. This is proof of authorization, separate from the RIS. PDF, JPG, JPEG, or PNG, up to 10 MB.</p>
                        </div>
                        <Field id="req_supporting_document_type" label={<>
                                Document type <span className="text-red-600" aria-hidden="true">*</span>
                                <span className="sr-only"> (required)</span>
                            </>} error={form.errors.supporting_document_type} ><Select
                                inputId="req_supporting_document_type"
                                name="supporting_document_type"
                                aria-label="Document type"
                                aria-invalid={Boolean(form.errors.supporting_document_type)}
                                value={selectedDocumentTypeOption}
                                onChange={(selected) => {
                                    const nextVal = selected?.value || '';
                                    if (nextVal === 'Specify Other') {
                                        const trimmed = otherDocumentSpecification.trim();
                                        form.setData('supporting_document_type', trimmed ? `Specify Other: ${trimmed}` : 'Specify Other');
                                    } else {
                                        setOtherDocumentSpecification('');
                                        form.setData('supporting_document_type', nextVal);
                                    }
                                    form.clearErrors('supporting_document_type');
                                }}
                                options={SUPPORTING_DOCUMENT_TYPE_OPTIONS}
                                placeholder="Select document type..."
                                styles={getInstitutionalSelectStyles(Boolean(form.errors.supporting_document_type))}
                                classNamePrefix="react-select"
                                isSearchable={false}
                            /></Field>

                        {isSpecifyOther && (
                            <div className="rounded-lg p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 space-y-1.5 transition-all">
                                <label htmlFor="req_specify_other_document" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Specify Other Document Type <span className="text-red-600 dark:text-red-300" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </label>
                                <input
                                    id="req_specify_other_document"
                                    name="specify_other_document"
                                    type="text"
                                    required
                                    value={otherDocumentSpecification}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setOtherDocumentSpecification(val);
                                        form.clearErrors('supporting_document_type');
                                        const trimmed = val.trim();
                                        form.setData('supporting_document_type', trimmed ? `Specify Other: ${trimmed}` : 'Specify Other');
                                    }}
                                    placeholder="e.g. Special Order No. 12, Approved Project Contract, Board Resolution..."
                                    className="ui-field w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm"
                                />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Please enter the specific name, title, or reference number of this authorization document.
                                </p>
                            </div>
                        )}
                        <Field id="req_supporting_document" label={<>
                                Upload Approved Supporting Document <span className="text-red-600" aria-hidden="true">*</span>
                                <span className="sr-only"> (required)</span>
                            </>} error={form.errors.supporting_document} ><input id="req_supporting_document" key={`${request?.id || 'new'}-${show}`} type="file" accept=".pdf,.jpg,.jpeg,.png" required={!request?.supporting_document_name && !form.data.supporting_document} onChange={e => {
                                const file = e.target.files?.[0] || null;
                                form.clearErrors('supporting_document');
                                if (file && (!/\.(pdf|jpe?g|png)$/i.test(file.name) || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
                                    form.setData('supporting_document', null);
                                    form.setError('supporting_document', 'Choose a PDF, JPG, JPEG, or PNG file no larger than 10 MB.');
                                    e.target.value = '';
                                    return;
                                }
                                form.setData('supporting_document', file);
                            }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:font-medium dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-slate-700 cursor-pointer" /></Field>
                        {form.data.supporting_document && <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{form.data.supporting_document.name}</span>
                            {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-900 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200 underline">Preview</a>}
                            <Button variant="secondary" type="button" onClick={() => { form.setData('supporting_document', null); const input = document.querySelector<HTMLInputElement>('#req_supporting_document'); if (input) input.value = ''; }} className="">Remove selection</Button>
                        </div>}
                        {!form.data.supporting_document && request?.supporting_document_name && <p className="text-sm text-slate-600 dark:text-slate-400">Current: <a className="underline font-medium text-slate-800 dark:text-slate-200" href={route('inventory.requests.document', { supplyRequest: request.id, inline: 1 })} target="_blank" rel="noopener noreferrer">{request.supporting_document_name}</a>. Select a file to replace it.</p>}
                    </section>}
                    </DialogBody>

                    {/* Footer Actions */}
                    <DialogFooter>
                        <Button variant="secondary"
                            type="button"
                            onClick={handleModalClose}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="submit"
                            disabled={form.processing || assignmentMissing || hasStockError}
                            loading={form.processing}
                            className="tabular-nums"
                        >
                            {isRestocked
                                ? 'Submit Official Requisition'
                                : isPreRequest
                                    ? (request ? 'Update Pre-Request' : 'Submit Pre-Request')
                                    : (request ? 'Save Changes' : 'Submit Supply Request')}
                        </Button>
                    </DialogFooter>
                </form>
        </Modal>
    );
}
