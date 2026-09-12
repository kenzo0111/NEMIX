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
    const isCreate = mode === 'create';
    const title = isCreate ? 'Register New Supplier' : 'Update Supplier Details';
    const submitLabel = isCreate ? 'Register Supplier' : 'Save Changes';

    const selectedStatusOption = FORM_STATUS_OPTIONS.find(
        (opt) => opt.value === formData.status
    ) || FORM_STATUS_OPTIONS[0];

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" closeable={!isSubmitting}>
            <div className="relative bg-white rounded-lg overflow-hidden shadow-xl border border-gray-200">
                {/* Institutional Maroon Top Accent Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-gray-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-950 flex items-center justify-center border border-red-100/80 shadow-xs shrink-0">
                            {isCreate ? (
                                <Building2 className="w-5 h-5 text-red-900" />
                            ) : (
                                <Edit3 className="w-5 h-5 text-red-900" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                {title}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {isCreate
                                    ? 'Maintain an accredited vendor record for university consumables.'
                                    : 'Update official accreditation and compliance record.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md disabled:opacity-50 transition-colors shrink-0 ml-2"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <div className="p-4 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                        {/* Section 1: Business Information */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-gray-100">
                                <Building2 className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Business Information
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="supplier-name" className="block text-xs font-medium text-gray-700 mb-1">
                                        Business Name <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="supplier-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => onChangeField('name', e.target.value)}
                                        placeholder="e.g. ABC Office Supplies Trading"
                                        required
                                        disabled={isSubmitting}
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs shadow-xs focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-colors ${
                                            errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.name && (
                                         <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="supplier-tin" className="block text-xs font-medium text-gray-700 mb-1">
                                        Tax ID (TIN) <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="supplier-tin"
                                        type="text"
                                        value={formData.tin}
                                        onChange={(e) => onChangeField('tin', e.target.value)}
                                        placeholder="e.g. 000-123-456-000"
                                        required
                                        disabled={isSubmitting}
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono shadow-xs focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-colors ${
                                            errors.tin ? 'border-red-500 focus:border-red-600' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.tin && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.tin}</p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="supplier-address" className="block text-xs font-medium text-gray-700 mb-1">
                                        Business Address <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="supplier-address"
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => onChangeField('address', e.target.value)}
                                        placeholder="e.g. Provincial Capitol Complex, Daet, Camarines Norte"
                                        required
                                        disabled={isSubmitting}
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs shadow-xs focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-colors ${
                                            errors.address ? 'border-red-500 focus:border-red-600' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Registration Information */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-gray-100">
                                <FileText className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Registration & Classification
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="supplier-registration-number" className="block text-xs font-medium text-gray-700 mb-1">
                                        Registration Number <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="supplier-registration-number"
                                        type="text"
                                        value={formData.reg_number}
                                        onChange={(e) => onChangeField('reg_number', e.target.value)}
                                        placeholder="e.g. 2023-112233"
                                        required
                                        disabled={isSubmitting}
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono shadow-xs focus:ring-1 focus:ring-red-900 focus:border-red-900 transition-colors ${
                                            errors.reg_number ? 'border-red-500 focus:border-red-600' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.reg_number && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.reg_number}</p>
                                    )}
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-700 mb-1">
                                        Classification
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-md text-xs text-gray-800 font-medium select-none">
                                        <span className="w-2 h-2 rounded-full bg-red-900 shrink-0"></span>
                                        <span>{CATEGORY_DISPLAY_LABEL}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Dedicated consumable office supplies registry.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Supplier Status */}
                        <div>
                            <div className="flex items-center gap-2 pb-2 mb-3.5 border-b border-gray-100">
                                <ShieldCheck className="w-4 h-4 text-red-900" />
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    Compliance & Status
                                </h4>
                            </div>
                            <div className="max-w-sm">
                                <label htmlFor="supplier-status" className="block text-xs font-medium text-gray-700 mb-1">
                                    Accreditation Status <span className="text-red-700">*</span>
                                </label>
                                <Select<{ value: SupplierStatus; label: string }>
                                    inputId="supplier-status"
                                    options={FORM_STATUS_OPTIONS}
                                    value={selectedStatusOption}
                                    onChange={(opt) => onChangeField('status', (opt?.value || 'active') as SupplierStatus)}
                                    isDisabled={isSubmitting}
                                    classNamePrefix="react-select"
                                    styles={institutionalSelectStyles}
                                />
                                {errors.status && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.status}</p>
                                )}

                                <div className="mt-2 text-[11px] text-gray-600 bg-gray-50/90 rounded-md p-2.5 border border-gray-200/70 flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                    <span>
                                        {formData.status === 'active' && 'Active suppliers are eligible for purchase orders and delivery receiving.'}
                                        {formData.status === 'pending' && 'Supplier accreditation is pending review or document renewal.'}
                                        {formData.status === 'blacklisted' && 'Supplier is disqualified from receiving new consignments and procurements.'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/75 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-4 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white rounded-md text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : isCreate ? (
                                <Plus className="w-3.5 h-3.5 text-amber-300" />
                            ) : (
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>{submitLabel}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
