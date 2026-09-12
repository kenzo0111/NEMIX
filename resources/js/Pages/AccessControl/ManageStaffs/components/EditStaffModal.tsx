import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select, { StylesConfig } from 'react-select';
import { Edit2, User, Mail, X } from 'lucide-react';
import { EditStaffFormData, SelectOption, Staff } from '../types';

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    roleOptions: SelectOption[];
}

const modalSelectStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        '&:hover': { borderColor: '#7f1d1d' },
        minHeight: '38px',
        fontSize: '0.875rem',
        backgroundColor: '#ffffff',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#1f2937',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: state.isSelected ? '600' : '500',
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 60,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
};

export default function EditStaffModal({
    isOpen,
    onClose,
    staff,
    roleOptions,
}: EditStaffModalProps) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm<EditStaffFormData>({
        name: '',
        email: '',
        role: '',
    });

    useEffect(() => {
        if (staff && isOpen) {
            setData({
                name: staff.name,
                email: staff.email,
                role: staff.role,
            });
            clearErrors();
        } else if (!isOpen) {
            reset();
            clearErrors();
        }
    }, [staff, isOpen]);

    if (!staff) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.name.trim() || !data.email.trim() || !data.role) {
            return;
        }

        put(route('access-control.staffs.update', staff.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    const handleClose = () => {
        clearErrors();
        onClose();
    };

    const selectedRoleOption = roleOptions.find((opt) => opt.value === data.role) || null;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="md">
            <div className="overflow-hidden rounded-xl bg-white shadow-xl">
                {/* Institutional Maroon Accent Bar */}
                <div className="h-1.5 w-full bg-red-900 shrink-0"></div>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100/80 flex items-center justify-center shrink-0">
                            <Edit2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 truncate">Edit Staff Account</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                Update credentials and system role for{' '}
                                <strong className="text-gray-800 font-semibold">{staff.name}</strong>.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        {/* Full Name */}
                        <div>
                            <label
                                htmlFor="edit-staff-name"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                            >
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    id="edit-staff-name"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-red-900 focus:ring-red-900'
                                    } focus:outline-none focus:ring-1 bg-white text-gray-900 placeholder:text-gray-400 transition-colors`}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Address (Read-only) */}
                        <div>
                            <label
                                htmlFor="edit-staff-email"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    id="edit-staff-email"
                                    value={data.email}
                                    readOnly
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed select-none font-mono"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">Email address cannot be modified after registration.</p>
                        </div>

                        {/* System Role */}
                        <div>
                            <label
                                htmlFor="edit-staff-role"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                            >
                                System Role <span className="text-red-600">*</span>
                            </label>
                            <Select<SelectOption, false>
                                inputId="edit-staff-role"
                                value={selectedRoleOption}
                                onChange={(opt) => {
                                    setData('role', opt?.value || '');
                                    if (errors.role) clearErrors('role');
                                }}
                                options={roleOptions}
                                styles={modalSelectStyles}
                                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                placeholder="Select a system role"
                            />
                            {errors.role && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.role}</p>
                            )}
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 border-t border-gray-200 gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
