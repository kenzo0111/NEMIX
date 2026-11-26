import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import useValidationFocus from '@/Hooks/useValidationFocus';
import React, { useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { InventoryItem, DivisionGroup, IssuanceLine } from '../types';
import { FUND_CLUSTER_OPTIONS, FALLBACK_DIVISIONS } from '../constants';
import { IssuanceItemRow } from './IssuanceItemRow';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { getLocalDateString } from '@/utils/dateUtils';
import { FileSpreadsheet, X, Plus } from 'lucide-react';

interface IssuanceFormModalProps {
    show: boolean;
    onClose: () => void;
    items: InventoryItem[];
    divisions?: DivisionGroup[];
    defaultApprovedBy: string;
    defaultApprovedByDesignation: string;
    defaultIssuedBy: string;
    defaultIssuedByDesignation: string;
    onSuccessNotification: (message: string) => void;
}

export const IssuanceFormModal: React.FC<IssuanceFormModalProps> = ({
    show,
    onClose,
    items,
    divisions,
    defaultApprovedBy,
    defaultApprovedByDesignation,
    defaultIssuedBy,
    defaultIssuedByDesignation,
    onSuccessNotification,
}) => {
    const divisionList = divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

    const form = useForm({
        recipient: '',
        date_issued: getLocalDateString(),
        department: '',
        fund_cluster: '01',
        recipient_designation: '',
        purpose: '',
        approved_by: defaultApprovedBy,
        approved_by_designation: defaultApprovedByDesignation,
        issued_by_name: defaultIssuedBy,
        issued_by_position: defaultIssuedByDesignation,
        issuances: [{ item_id: '', quantity: '' }] as IssuanceLine[],
    });

    useValidationFocus(form.errors);

    React.useEffect(() => {
        if (show) {
            form.setData((prev) => ({
                ...prev,
                approved_by: defaultApprovedBy,
                approved_by_designation: defaultApprovedByDesignation,
                issued_by_name: defaultIssuedBy,
                issued_by_position: defaultIssuedByDesignation,
            }));
        }
    }, [show, defaultApprovedBy, defaultApprovedByDesignation, defaultIssuedBy, defaultIssuedByDesignation]);

    // Selected division option for react-select
    const selectedDivisionOption = useMemo(() => {
        for (const group of divisionList) {
            const match = group.options.find((opt) => opt.value === form.data.department);
            if (match) return match;
        }
        return null;
    }, [form.data.department, divisionList]);

    // Selected fund cluster option for react-select
    const selectedFundClusterOption = useMemo(() => {
        return (
            FUND_CLUSTER_OPTIONS.find(
                (opt) => opt.value === form.data.fund_cluster || opt.label === form.data.fund_cluster
            ) || null
        );
    }, [form.data.fund_cluster]);

    // List of item IDs currently selected across all rows
    const selectedItemIds = useMemo(() => {
        return form.data.issuances
            .map((line) => Number(line.item_id))
            .filter((id) => !isNaN(id) && id > 0);
    }, [form.data.issuances]);

    const handleAddItem = () => {
        form.setData('issuances', [...form.data.issuances, { item_id: '', quantity: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (form.data.issuances.length > 1) {
            form.setData(
                'issuances',
                form.data.issuances.filter((_, i) => i !== index)
            );
        }
    };

    const handleChangeItem = (index: number, itemId: string) => {
        const next = [...form.data.issuances];
        next[index] = { ...next[index], item_id: itemId };
        form.setData('issuances', next);
    };

    const handleChangeQuantity = (index: number, quantity: string) => {
        const next = [...form.data.issuances];
        next[index] = { ...next[index], quantity };
        form.setData('issuances', next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter valid non-empty rows
        const validRows = form.data.issuances.filter((line) => line.item_id && line.quantity);
        if (validRows.length === 0) {
            form.setError('issuances', 'Please add at least one item with a valid quantity.');
            return;
        }

        form.post(route('inventory.issuance.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
                onSuccessNotification('Issuance record created successfully.');
            },
        });
    };

    const handleModalClose = () => {
        if (!form.processing) {
            form.reset();
            form.clearErrors();
            onClose();
        }
    };

    return (
        <Modal show={show} onClose={handleModalClose} maxWidth="3xl" closeable={!form.processing} ariaLabel="Record Stock Issuance">
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Formal Administrative Header */}
            <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-red-900 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            Record Stock Issuance
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium break-words">
                            Administrative Requisition & Issue Slip (RIS) Entry
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
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">For Authorized Personnel, Supply Coordinators, and Inventory Staff, release supplies through their approved request in the approval queue. Their weekly allowance is recorded there.</p>
                    {/* SECTION 1: Recipient Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                1. Recipient Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field id="issuance_recipient" label={<>
                                    Recipient Name <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </>} error={form.errors.recipient} ><input
                                    id="issuance_recipient"
                                    name="recipient"
                                    type="text"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.recipient)}
                                    aria-describedby={form.errors.recipient ? 'issuance_recipient-error' : undefined}
                                    value={form.data.recipient}
                                    onChange={(e) => form.setData('recipient', e.target.value)}
                                    placeholder="Full name of requesting personnel"
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.recipient ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>

                            <Field id="issuance_date_issued" label={<>
                                    Date Issued <span className="text-red-600" aria-hidden="true">*</span>
                                    <span className="sr-only"> (required)</span>
                                </>} error={form.errors.date_issued} ><input
                                    id="issuance_date_issued"
                                    name="date_issued"
                                    type="date"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(form.errors.date_issued)}
                                    aria-describedby={form.errors.date_issued ? 'issuance_date_issued-error' : undefined}
                                    value={form.data.date_issued}
                                    onChange={(e) => form.setData('date_issued', e.target.value)}
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.date_issued ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>

                            <Field id="issuance_department" label={<>
                                    Division / Office
                                </>} error={form.errors.department} ><Select
                                    inputId="issuance_department"
                                    name="department"
                                    aria-label="Division or Office"
                                    aria-invalid={Boolean(form.errors.department)}
                                    aria-describedby={form.errors.department ? 'issuance_department-error' : undefined}
                                    value={selectedDivisionOption}
                                    onChange={(selected) => form.setData('department', selected?.value || '')}
                                    options={divisionList}
                                    placeholder="Select college, unit, or office..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.department))}
                                    classNamePrefix="react-select"
                                    isSearchable
                                    isClearable
                                /></Field>

                            <Field id="issuance_recipient_designation" label={<>
                                    Recipient Designation
                                </>} error={form.errors.recipient_designation} ><input
                                    id="issuance_recipient_designation"
                                    name="recipient_designation"
                                    type="text"
                                    aria-invalid={Boolean(form.errors.recipient_designation)}
                                    aria-describedby={form.errors.recipient_designation ? 'issuance_recipient_designation-error' : undefined}
                                    value={form.data.recipient_designation}
                                    onChange={(e) => form.setData('recipient_designation', e.target.value)}
                                    placeholder="e.g. Dean, Department Head, Faculty"
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
                            <Field id="issuance_fund_cluster" label={<>
                                    Fund Cluster
                                </>} error={form.errors.fund_cluster} ><Select
                                    inputId="issuance_fund_cluster"
                                    name="fund_cluster"
                                    aria-label="Fund Cluster"
                                    aria-invalid={Boolean(form.errors.fund_cluster)}
                                    aria-describedby={form.errors.fund_cluster ? 'issuance_fund_cluster-error' : undefined}
                                    value={selectedFundClusterOption}
                                    onChange={(selected) => form.setData('fund_cluster', selected?.value || '')}
                                    options={FUND_CLUSTER_OPTIONS}
                                    placeholder="Select government fund cluster..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.fund_cluster))}
                                    classNamePrefix="react-select"
                                /></Field>

                            <Field id="issuance_purpose" label={<>
                                    Purpose
                                </>} error={form.errors.purpose} ><input
                                    id="issuance_purpose"
                                    name="purpose"
                                    type="text"
                                    aria-invalid={Boolean(form.errors.purpose)}
                                    aria-describedby={form.errors.purpose ? 'issuance_purpose-error' : undefined}
                                    value={form.data.purpose}
                                    onChange={(e) => form.setData('purpose', e.target.value)}
                                    placeholder="Purpose of supply requisition"
                                    className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${form.errors.purpose ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                /></Field>
                        </div>
                    </div>

                    {/* SECTION 3: Items to Issue */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                3. Items to Issue
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

                        {form.errors.issuances && (
                            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded text-sm text-red-700 dark:text-red-300 font-medium">
                                {form.errors.issuances}
                            </div>
                        )}

                        <div className="space-y-3">
                            {form.data.issuances.map((line, index) => (
                                <IssuanceItemRow
                                    key={index}
                                    index={index}
                                    itemLine={line}
                                    items={items}
                                    selectedItemIds={selectedItemIds}
                                    canRemove={form.data.issuances.length > 1}
                                    onChangeItem={handleChangeItem}
                                    onChangeQuantity={handleChangeQuantity}
                                    onRemove={handleRemoveItem}
                                    errorItem={form.errors[`issuances.${index}.item_id` as keyof typeof form.errors]}
                                    errorQuantity={form.errors[`issuances.${index}.quantity` as keyof typeof form.errors]}
                                />
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: Authorization */}
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
                                            type="date"
                                            value={form.data.date_issued}
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
                                            type="date"
                                            value={form.data.date_issued}
                                            readOnly
                                            className="ui-field w-full h-10 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            disabled={form.processing}
                            loading={form.processing}
                            className="tabular-nums"
                        >
                            Record Issuance
                        </Button>
                    </DialogFooter>
                </form>
        </Modal>
    );
};
