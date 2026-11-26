import useValidationFocus from '@/Hooks/useValidationFocus';
import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import Modal from '@/Components/Modal';
import {
    Building2,
    FileText,
    ShieldCheck,
    X,
    Check,
    Plus,
    Edit3,
    Info,
} from 'lucide-react';
import { SupplierFormModalProps, SupplierStatus } from '../types';
import { FORM_STATUS_OPTIONS, institutionalSelectStyles, CATEGORY_DISPLAY_LABEL } from '../constants';

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
    show,
    mode,
    isSubmitting,
    errors,
    formData,
    onChangeField,
    onSubmit,
    onClose,
}) => {
    useValidationFocus(errors);
    const isCreate = mode === 'create';
    const title = isCreate ? 'Register New Supplier' : 'Update Supplier Details';
    const submitLabel = isCreate ? 'Register Supplier' : 'Save Changes';

    const selectedStatusOption = FORM_STATUS_OPTIONS.find(
        (opt) => opt.value === formData.status
    ) || FORM_STATUS_OPTIONS[0];

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg" closeable={!isSubmitting} ariaLabel={title}>
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Header */}
            <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                        {isCreate ? (
                            <Building2 className="w-5 h-5 text-red-900 dark:text-red-400" />
                        ) : (
                            <Edit3 className="w-5 h-5 text-red-900 dark:text-red-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            {title}
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">
                            {isCreate
                                ? 'Maintain an accredited vendor record for university consumables.'
                                : 'Update official accreditation and compliance record.'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="shrink-0 ml-2"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            {/* Form */}
            <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
                <DialogBody className="space-y-5 text-sm">
                        {/* Section 1: Business Information */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-slate-100 dark:border-slate-800">
                                <Building2 className="w-4 h-4 text-red-900 dark:text-red-400" />
                                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                    Business Information
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field id="supplier-name" label="Business Name" required error={errors.name}><input
                                        id="supplier-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => onChangeField('name', e.target.value)}
                                        placeholder="e.g. ABC Office Supplies Trading"
                                        required
                                        disabled={isSubmitting}
                                        className="ui-field w-full px-3 py-2"
                                    /></Field>

                                <Field id="supplier-tin" label={<>
                                        Tax ID (TIN) <span className="text-red-700 dark:text-red-400">*</span>
                                    </>} error={errors.tin} ><input aria-invalid={Boolean(errors.tin)}
                                        id="supplier-tin"
                                        type="text"
                                        value={formData.tin}
                                        onChange={(e) => onChangeField('tin', e.target.value)}
                                        placeholder="e.g. 000-123-456-000"
                                        required
                                        disabled={isSubmitting}
                                        className={"ui-field " + (`w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 transition-colors ${errors.tin ? "border-red-500 dark:border-red-500 focus:border-red-600" : "border-slate-300 dark:border-slate-700"}`)}
                                    /></Field>

                                <Field id="supplier-address" label={<>
                                        Business Address <span className="text-red-700 dark:text-red-400">*</span>
                                    </>} error={errors.address} className="sm:col-span-2"><input aria-invalid={Boolean(errors.address)}
                                        id="supplier-address"
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => onChangeField('address', e.target.value)}
                                        placeholder="e.g. Provincial Capitol Complex, Daet, Camarines Norte"
                                        required
                                        disabled={isSubmitting}
                                        className={"ui-field " + (`w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-md text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 transition-colors ${errors.address ? "border-red-500 dark:border-red-500 focus:border-red-600" : "border-slate-300 dark:border-slate-700"}`)}
                                    /></Field>
                            </div>
                        </div>

                        {/* Section 2: Registration Information */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-slate-100 dark:border-slate-800">
                                <FileText className="w-4 h-4 text-red-900 dark:text-red-400" />
                                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                    Registration & Classification
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field id="supplier-registration-number" label={<>
                                        Registration Number <span className="text-red-700 dark:text-red-400">*</span>
                                    </>} error={errors.reg_number} ><input aria-invalid={Boolean(errors.reg_number)}
                                        id="supplier-registration-number"
                                        type="text"
                                        value={formData.reg_number}
                                        onChange={(e) => onChangeField('reg_number', e.target.value)}
                                        placeholder="e.g. 2023-112233"
                                        required
                                        disabled={isSubmitting}
                                        className={"ui-field " + (`w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 transition-colors ${errors.reg_number ? "border-red-500 dark:border-red-500 focus:border-red-600" : "border-slate-300 dark:border-slate-700"}`)}
                                    /></Field>

                                <div>
                                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Classification
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-800 dark:text-slate-200 font-medium select-none">
                                        <span className="w-2 h-2 rounded-full bg-red-900 dark:bg-red-500 shrink-0"></span>
                                        <span>{CATEGORY_DISPLAY_LABEL}</span>
                                    </div>
                                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Dedicated consumable office supplies registry.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Supplier Status */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-slate-100 dark:border-slate-800">
                                <ShieldCheck className="w-4 h-4 text-red-900 dark:text-red-400" />
                                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                                    Compliance & Status
                                </h4>
                            </div>
                            <div className="max-w-sm">
                                <label htmlFor="supplier-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Accreditation Status <span className="text-red-700 dark:text-red-400">*</span>
                                </label>
                                <Select<{ value: SupplierStatus; label: string }>
                                    aria-invalid={Boolean(errors.status)}
                                    aria-describedby={errors.status ? 'supplier-status-error' : undefined}
                                    inputId="supplier-status"
                                    options={FORM_STATUS_OPTIONS}
                                    value={selectedStatusOption}
                                    onChange={(opt) => onChangeField('status', (opt?.value || 'active') as SupplierStatus)}
                                    isDisabled={isSubmitting}
                                    classNamePrefix="react-select"
                                    styles={institutionalSelectStyles}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition="fixed"
                                />
                                {errors.status && (
                                    <p id="supplier-status-error" role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errors.status}</p>
                                )}

                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-950/90 rounded-md p-2.5 border border-slate-200/70 dark:border-slate-800 flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                                    <span>
                                        {formData.status === 'active' && 'Active suppliers are eligible for purchase orders and delivery receiving.'}
                                        {formData.status === 'pending' && 'Supplier accreditation is pending review or document renewal.'}
                                        {formData.status === 'blacklisted' && 'Supplier is disqualified from receiving new consignments and procurements.'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogBody>

                    {/* Footer */}
                    <DialogFooter>
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            className="inline-flex items-center gap-1.5"
                        >
                            {isCreate ? (
                                <Plus className="w-3.5 h-3.5 text-amber-300" />
                            ) : (
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>{submitLabel}</span>
                        </Button>
                    </DialogFooter>
                </form>
        </Modal>
    );
};
