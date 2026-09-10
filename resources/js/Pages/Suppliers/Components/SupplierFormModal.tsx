import React from 'react';
import Select from 'react-select';
import Modal from '@/Components/Modal';
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
    const title = isCreate ? 'Register Supplier' : 'Update Supplier';
    const submitLabel = isCreate ? 'Register Supplier' : 'Save Changes';

    const selectedStatusOption = FORM_STATUS_OPTIONS.find(
        (opt) => opt.value === formData.status
    ) || FORM_STATUS_OPTIONS[0];

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" closeable={!isSubmitting}>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Maintain an accredited supplier record.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
                        {/* Section 1: Business Information */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-4 border-b border-gray-200">
                                Business Information
                            </h4>
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
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs shadow-xs focus:ring-1 focus:ring-red-900 transition-colors ${
                                            errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-900'
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
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono shadow-xs focus:ring-1 focus:ring-red-900 transition-colors ${
                                            errors.tin ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-900'
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
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs shadow-xs focus:ring-1 focus:ring-red-900 transition-colors ${
                                            errors.address ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-900'
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
                            <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-4 border-b border-gray-200">
                                Registration Information
                            </h4>
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
                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-mono shadow-xs focus:ring-1 focus:ring-red-900 transition-colors ${
                                            errors.reg_number ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-900'
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
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 font-medium select-none">
                                        {CATEGORY_DISPLAY_LABEL}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Dedicated consumable office supplies registry.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Supplier Status */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider pb-2 mb-4 border-b border-gray-200">
                                Supplier Status
                            </h4>
                            <div className="max-w-xs">
                                <label htmlFor="supplier-status" className="block text-xs font-medium text-gray-700 mb-1">
                                    Compliance Status <span className="text-red-700">*</span>
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
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/75 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            <span>{submitLabel}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
