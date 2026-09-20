import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select, { StylesConfig } from 'react-select';
import { UserPlus, User, Mail, X, Info } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
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
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : 'var(--border-color, #e5e7eb)',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        '&:hover': { borderColor: '#7f1d1d' },
        minHeight: '38px',
        fontSize: '0.875rem',
        backgroundColor: 'var(--surface-card, #ffffff)',
        color: 'var(--text-primary, #111827)',
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'var(--text-primary, #111827)',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? 'rgba(127, 29, 29, 0.15)' : 'var(--surface-card, #ffffff)',
        color: state.isSelected ? '#ffffff' : 'var(--text-primary, #1f2937)',
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
        backgroundColor: 'var(--surface-card, #ffffff)',
        border: '1px solid var(--border-color, #e5e7eb)',
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

    const { isSystemAdmin } = useAuthorization();

    const assignableRoleOptions = useMemo(() => {
        if (isSystemAdmin) {
            return roleOptions;
        }
        return roleOptions.filter((opt) => {
            const val = opt.value.toLowerCase().trim();
            return val !== 'system admin' && val !== 'system administrator';
        });
    }, [roleOptions, isSystemAdmin]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const selectedRoleOption = assignableRoleOptions.find((opt) => opt.value === data.role) || null;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="md" closeable={!processing} ariaLabel="Add Staff Account">
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
                {/* Institutional Maroon Accent Bar */}
                <div className="h-1.5 w-full bg-red-900 shrink-0"></div>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">Add Staff Account</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                                Register a university staff member and assign an administrative role.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
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
                                htmlFor="create-staff-name"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5"
                            >
                                Full Name <span className="text-red-600 dark:text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
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
                                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600'
                                    } focus:outline-none focus:ring-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors`}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Address */}
                        <div>
                            <label
                                htmlFor="create-staff-email"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5"
                            >
                                Email Address <span className="text-red-600 dark:text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
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
                                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600'
                                    } focus:outline-none focus:ring-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors`}
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{errors.email}</p>
                            )}
                            <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200/60 dark:border-slate-700">
                                <Info className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                <span>A registration invitation link will be dispatched to this email address.</span>
                            </div>
                        </div>

                        {/* System Role */}
                        <div>
                            <label
                                htmlFor="create-staff-role"
                                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5"
                            >
                                System Role <span className="text-red-600 dark:text-red-400">*</span>
                            </label>
                            <Select<SelectOption, false>
                                inputId="create-staff-role"
                                value={selectedRoleOption}
                                onChange={(opt) => {
                                    setData('role', opt?.value || '');
                                    if (errors.role) clearErrors('role');
                                }}
                                options={assignableRoleOptions}
                                styles={modalSelectStyles}
                                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                placeholder="Select a system role"
                            />
                            {errors.role && (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{errors.role}</p>
                            )}
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50/80 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer text-center"
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
