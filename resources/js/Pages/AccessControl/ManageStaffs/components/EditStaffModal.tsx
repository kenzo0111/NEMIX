import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import DepartmentAssignmentFields from './DepartmentAssignmentFields';
import React, { useEffect, useMemo } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Select, { StylesConfig } from 'react-select';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { Edit2, User, Mail, X, Loader2 } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { useValidationFocus } from '@/Hooks/useValidationFocus';
import { EditStaffFormData, SelectOption, Staff } from '../types';

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: Staff | null;
    roleOptions: SelectOption[];
}

const modalSelectStyles: StylesConfig<SelectOption, false> = {
    ...getInstitutionalSelectStyles<SelectOption, false>(),
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
}: EditStaffModalProps) {    const { departmentHeads = {} } = usePage().props as unknown as { departmentHeads: Record<string, number> };
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm<EditStaffFormData>({
        department: '',
        designation: '',
        office_head_id: '',
        office_head_name: '',
        office_head_designation: '',
        name: '',
        email: '',
        role: '',
    });
    useValidationFocus(errors);

    const { can, isSystemAdmin, user: currentUser } = useAuthorization();

    const assignableRoleOptions = useMemo(() => {
        if (isSystemAdmin) {
            return roleOptions;
        }
        return roleOptions.filter((opt) => {
            const val = opt.value.toLowerCase().trim();
            return val !== 'system admin' && val !== 'system administrator';
        });
    }, [roleOptions, isSystemAdmin]);

    useEffect(() => {
        if (staff && isOpen) {
            setData({
                department: staff.department || '',
                designation: staff.designation || '',
                office_head_id: staff.office_head_id ? String(staff.office_head_id) : (departmentHeads[staff.department || ''] ? String(departmentHeads[staff.department || '']) : ''),
                office_head_name: '',
                office_head_designation: staff.office_head?.designation || '',
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

    const isSelf = currentUser?.id === staff?.id;
    const canChangeRole = (isSystemAdmin || can('users.assign-role')) && (!isSelf || isSystemAdmin);

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

    const selectedRoleOption = assignableRoleOptions.find((opt) => opt.value === data.role) || null;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="4xl" closeable={!processing} ariaLabel="Edit Staff Account">
            {/* Institutional Maroon Accent Bar */}
            <div className="h-1.5 w-full bg-red-900 shrink-0"></div>

            {/* Modal Header */}
            <DialogHeader className="flex items-center justify-between shrink-0 px-5 sm:px-7 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-400 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center shrink-0">
                        <Edit2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Staff Account</h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                            Update account details and Delivery Unit assignment for{' '}
                            <strong className="text-slate-800 dark:text-slate-200 font-semibold">{staff.name}</strong>.
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
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the staff member’s identity and system access.</p>
                            </div>
                        {/* Full Name */}
                        <Field id="edit-staff-name" label="Full Name" required error={errors.name}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input aria-invalid={Boolean(errors.name)}
                                    type="text"
                                    id="edit-staff-name"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    className={"ui-field " + (`w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border ${errors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600"} focus:outline-none focus:ring-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors`)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </Field>

                        {/* Email Address (Read-only) */}
                        <Field id="edit-staff-email" label="Email Address" error={errors.email}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    id="edit-staff-email"
                                    value={data.email}
                                    readOnly
                                    className="ui-field w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none tabular-nums"
                                />
                            </div>
                            <p className="leading-relaxed mt-1 text-sm text-slate-500 dark:text-slate-400">Email address cannot be modified after registration.</p>
                        </Field>

                        {/* System Role */}
                        <Field id="edit-staff-role" label="System Role" required error={errors.role}>
                            {canChangeRole ? (
                                <Select<SelectOption, false>
                                    inputId="edit-staff-role"
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
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        id="edit-staff-role"
                                        value={staff.role}
                                        readOnly
                                        className="ui-field w-full pl-3 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none font-semibold"
                                    />
                                    <p className="leading-relaxed mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {isSelf
                                            ? 'You cannot modify your own administrative role.'
                                            : 'Role modification requires administrative privileges.'}
                                    </p>
                                </div>
                            )}
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
                        disabled={processing}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin h-3.5 w-3.5 text-white shrink-0" />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    );
}
