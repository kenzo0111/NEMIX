import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import DepartmentAssignmentFields from './DepartmentAssignmentFields';
import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select, { StylesConfig } from 'react-select';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { UserPlus, User, Mail, X, Info, Loader2 } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { useValidationFocus } from '@/Hooks/useValidationFocus';
import { CreateStaffFormData, SelectOption } from '../types';

interface CreateStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleOptions: SelectOption[];
    defaultRole?: string;
}

const modalSelectStyles: StylesConfig<SelectOption, false> = {
    ...getInstitutionalSelectStyles<SelectOption, false>(),
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
        department: '',
        designation: '',
        office_head_id: '',
        office_head_name: '',
        office_head_designation: '',
        name: '',
        email: '',
        role: defaultRole,
    });
    useValidationFocus(errors);

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
        <Modal show={isOpen} onClose={handleClose} maxWidth="4xl" closeable={!processing} ariaLabel="Add Staff Account">
            {/* Institutional Maroon Accent Bar */}
            <div className="h-1.5 w-full bg-red-900 shrink-0"></div>

            {/* Modal Header */}
            <DialogHeader className="flex items-center justify-between shrink-0 px-5 sm:px-7 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-xl font-semibold text-slate-900 dark:text-slate-100">Add Staff Account</h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                            Register a university staff member and assign an administrative role.
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={handleClose}
                    className="shrink-0 ml-2"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <DialogBody className="p-0">
                    <div className="grid min-h-0 gap-7 p-5 sm:p-7 md:grid-cols-2 md:gap-8">
                        <section className="min-w-0 space-y-5" aria-label="Account details">
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Account details</h4>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Register the staff member’s identity and system role.</p>
                            </div>

                            {/* Full Name */}
                            <Field id="create-staff-name" label="Full Name" required error={errors.name}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input aria-invalid={Boolean(errors.name)}
                                        type="text"
                                        id="create-staff-name"
                                        value={data.name}
                                        onChange={(e) => {
                                            setData('name', e.target.value);
                                            if (errors.name) clearErrors('name');
                                        }}
                                        placeholder="e.g. Dr. Maria Santos"
                                        className={"ui-field " + (`w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border ${errors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600"} focus:outline-none focus:ring-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors`)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </Field>

                            {/* Email Address */}
                            <Field id="create-staff-email" label="Email Address" required error={errors.email}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input aria-invalid={Boolean(errors.email)}
                                        type="email"
                                        id="create-staff-email"
                                        value={data.email}
                                        onChange={(e) => {
                                            setData('email', e.target.value);
                                            if (errors.email) clearErrors('email');
                                        }}
                                        placeholder="e.g. maria.santos@university.edu"
                                        className={"ui-field " + (`w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600"} focus:outline-none focus:ring-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors`)}
                                        required
                                    />
                                </div>
                                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md border border-slate-200/60 dark:border-slate-700">
                                    <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                    <span>A registration invitation link will be dispatched to this email address.</span>
                                </div>
                            </Field>

                            {/* System Role */}
                            <Field id="create-staff-role" label="System Role" required error={errors.role}>
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
                            </Field>
                        </section>

                        <DepartmentAssignmentFields
                            data={data}
                            errors={errors}
                            role={data.role}
                            required={data.role === 'Supply Coordinator' || data.role === 'Authorized Personnel'}
                            onChange={(field, value) => { setData(field, value); clearErrors(field); }}
                        />
                    </div>
                </DialogBody>

                {/* Modal Actions */}
                <DialogFooter className="flex shrink-0 flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end px-5 sm:px-7 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-slate-850/80 border-t border-slate-200 dark:border-slate-800 gap-2.5">
                    <Button variant="secondary"
                        type="button"
                        onClick={handleClose}
                        disabled={processing}
                        className="w-full sm:w-auto text-center"
                    >
                        Cancel
                    </Button>
                    <Button variant="primary"
                        type="submit"
                        loading={processing}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                    >
                        {!processing && <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{processing ? 'Adding Staff...' : 'Add Staff'}</span>
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    );
}
