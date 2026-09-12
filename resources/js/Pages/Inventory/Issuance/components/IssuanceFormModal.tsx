import React, { useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { InventoryItem, DivisionGroup, IssuanceLine } from '../types';
import { FUND_CLUSTER_OPTIONS, FALLBACK_DIVISIONS } from '../constants';
import { IssuanceItemRow } from './IssuanceItemRow';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { getLocalDateString } from '@/utils/dateUtils';

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
        <Modal show={show} onClose={handleModalClose} maxWidth="3xl" closeable={!form.processing}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
                {/* Formal Administrative Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Record Stock Issuance
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            Administrative Requisition & Issue Slip (RIS) Entry
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleModalClose}
                        disabled={form.processing}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
                    {/* SECTION 1: Recipient Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 font-mono">
                                1. Recipient Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Recipient Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.data.recipient}
                                    onChange={(e) => form.setData('recipient', e.target.value)}
                                    placeholder="Full name of requesting personnel"
                                    className={`w-full h-10 px-3 bg-white border rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs ${
                                        form.errors.recipient ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {form.errors.recipient && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{form.errors.recipient}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Date Issued <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.data.date_issued}
                                    onChange={(e) => form.setData('date_issued', e.target.value)}
                                    className={`w-full h-10 px-3 bg-white border rounded-md text-xs font-mono font-medium text-gray-900 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs ${
                                        form.errors.date_issued ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {form.errors.date_issued && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{form.errors.date_issued}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Division / Office
                                </label>
                                <Select
                                    value={selectedDivisionOption}
                                    onChange={(selected) => form.setData('department', selected?.value || '')}
                                    options={divisionList}
                                    placeholder="Select college, unit, or office..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.department))}
                                    classNamePrefix="react-select"
                                    isSearchable
                                    isClearable
                                />
                                {form.errors.department && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{form.errors.department}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Recipient Designation
                                </label>
                                <input
                                    type="text"
                                    value={form.data.recipient_designation}
                                    onChange={(e) => form.setData('recipient_designation', e.target.value)}
                                    placeholder="e.g. Dean, Department Head, Faculty"
                                    className={`w-full h-10 px-3 bg-white border rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs ${
                                        form.errors.recipient_designation ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {form.errors.recipient_designation && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">
                                        {form.errors.recipient_designation}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Accounting Information */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 font-mono">
                                2. Accounting Information
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Fund Cluster
                                </label>
                                <Select
                                    value={selectedFundClusterOption}
                                    onChange={(selected) => form.setData('fund_cluster', selected?.value || '')}
                                    options={FUND_CLUSTER_OPTIONS}
                                    placeholder="Select government fund cluster..."
                                    styles={getInstitutionalSelectStyles(Boolean(form.errors.fund_cluster))}
                                    classNamePrefix="react-select"
                                />
                                {form.errors.fund_cluster && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{form.errors.fund_cluster}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Purpose
                                </label>
                                <input
                                    type="text"
                                    value={form.data.purpose}
                                    onChange={(e) => form.setData('purpose', e.target.value)}
                                    placeholder="Purpose of supply requisition"
                                    className={`w-full h-10 px-3 bg-white border rounded-md text-xs font-medium text-gray-900 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs ${
                                        form.errors.purpose ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {form.errors.purpose && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{form.errors.purpose}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Items to Issue */}
                    <div>
                        <div className="pb-2 mb-3 border-b border-gray-200 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 font-mono">
                                3. Items to Issue
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-red-950 hover:text-red-800 font-semibold text-xs flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                + Add another item
                            </button>
                        </div>

                        {form.errors.issuances && (
                            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
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
                        <div className="pb-2 mb-3 border-b border-gray-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 font-mono">
                                4. Authorization (System Signatories)
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Approved By (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.approved_by}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Approved By Designation (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.approved_by_designation}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Issued By (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.issued_by_name}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Issued By Designation (Read-Only)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.issued_by_position}
                                    readOnly
                                    className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            disabled={form.processing}
                            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-5 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                        >
                            {form.processing ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Recording...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Record Issuance
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
