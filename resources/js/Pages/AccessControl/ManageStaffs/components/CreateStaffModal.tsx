import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select, { StylesConfig } from 'react-select';
import { UserPlus, User, Mail, X, Info } from 'lucide-react';
import { CreateStaffFormData, SelectOption } from '../types';

interface CreateStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleOptions: SelectOption[];
    defaultRole?: string;
}

const modalSelectStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
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
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
};

export default function CreateStaffModal({
    isOpen,
    onClose,
    roleOptions,
    defaultRole = 'Property Staff',
}: CreateStaffModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateStaffFormData>({
        name: '',
        email: '',
        role: defaultRole,
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
            clearErrors();
        } else if (!data.role && defaultRole) {
            setData('role', defaultRole);
        }
    }, [isOpen, defaultRole]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.name.trim() || !data.email.trim() || !data.role) {
            return;
        }

        post(route('access-control.staffs.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const selectedRoleOption = roleOptions.find((opt) => opt.value === data.role) || null;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="md">
            <div className="overflow-hidden rounded-lg bg-white shadow-xl">
                {/* Institutional Maroon Accent Bar */}
                <div className="h-1 w-full bg-red-900 shrink-0"></div>

                {/* Modal Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-50 text-red-900 rounded-md border border-red-100 shrink-0">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Add Staff</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Register a university staff member and assign an administrative system role.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {/* Full Name */}
                        <div>
                            <label
                                htmlFor="create-staff-name"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                            >
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    id="create-staff-name"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    placeholder="e.g. Dr. Maria Santos"
                                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${
                                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-900'
                                    } focus:outline-none focus:ring-1 bg-white text-gray-900 placeholder:text-gray-400`}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Address */}
                        <div>
                            <label
                                htmlFor="create-staff-email"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                            >
                                Email Address <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    id="create-staff-email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        if (errors.email) clearErrors('email');
                                    }}
                                    placeholder="e.g. maria.santos@university.edu"
                                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${
                                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-900'
                                    } focus:outline-none focus:ring-1 bg-white text-gray-900 placeholder:text-gray-400`}
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
                            )}
                            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>A registration invitation link will be dispatched to this email address.</span>
                            </p>
                        </div>

                        {/* System Role */}
                        <div>
                            <label
                                htmlFor="create-staff-role"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                            >
                                System Role <span className="text-red-600">*</span>
                            </label>
                            <Select<SelectOption, false>
                                inputId="create-staff-role"
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
                                <p className="mt-1 text-xs text-red-600 font-medium">{errors.role}</p>
                            )}
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end px-6 py-3.5 bg-gray-50/80 border-t border-gray-200 gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Adding Staff...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Add Staff</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
