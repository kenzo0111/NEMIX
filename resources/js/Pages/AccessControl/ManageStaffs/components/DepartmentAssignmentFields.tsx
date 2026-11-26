import { Button } from '@/Components/ui/button';
import { usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { UserPlus, ListFilter, CheckCircle2 } from 'lucide-react';

type Assignment = {
    department: string;
    designation?: string;
    office_head_id: string;
    office_head_name?: string;
    office_head_designation?: string;
};

type OfficeHead = {
    id: number;
    name: string;
    designation: string | null;
    department: string | null;
    office: string | null;
    is_active: boolean;
};

export default function DepartmentAssignmentFields({ data, onChange, errors, required, role }: {
    data: Assignment;
    onChange: (field: keyof Assignment, value: string) => void;
    errors: Partial<Record<keyof Assignment, string>>;
    required: boolean;
    role?: string;
}) {
    const { departments = [], officeHeads = [], departmentHeads = {} } = usePage().props as unknown as {
        departments: string[];
        officeHeads: OfficeHead[];
        departmentHeads: Record<string, number>;
    };

    const isAuthorizedPersonnel = role === 'Authorized Personnel';
    const [isManualMode, setIsManualMode] = useState<boolean>(() => Boolean(data.office_head_name && !data.office_head_id));
    const [showOptionalHead, setShowOptionalHead] = useState<boolean>(() => Boolean(data.office_head_id || data.office_head_name));

    useEffect(() => {
        if (data.office_head_name && !data.office_head_id) {
            setIsManualMode(true);
        }
    }, [data.office_head_name, data.office_head_id]);

    const selectDepartment = (department: string) => {
        onChange('department', department);
        if (!isAuthorizedPersonnel && !isManualMode) {
            const defaultHeadId = departmentHeads[department] ? String(departmentHeads[department]) : '';
            onChange('office_head_id', defaultHeadId);
            if (defaultHeadId) {
                const headObj = officeHeads.find(h => String(h.id) === defaultHeadId);
                onChange('office_head_designation', headObj?.designation || '');
                onChange('office_head_name', '');
            } else {
                onChange('office_head_designation', '');
            }
        }
    };

    const head = officeHeads.find(h => String(h.id) === data.office_head_id);
    const headOptions = officeHeads
        .filter(h => (h.is_active && h.designation?.trim()) || String(h.id) === data.office_head_id)
        .map(h => ({
            value: String(h.id),
            label: `${h.name} — ${h.designation || ''}${!h.is_active ? ' (inactive)' : ''}`,
            head: h,
        }));

    const selectLayout = {
        menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
        menuPosition: 'fixed' as const,
        menuPlacement: 'auto' as const,
        maxMenuHeight: 200,
    };

    const selectStyles = (hasError: boolean) => ({
        ...getInstitutionalSelectStyles(hasError),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    });

    const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 transition-colors';

    const handleSelectHead = (option: { value: string; label: string; head?: OfficeHead } | null) => {
        if (!option) {
            onChange('office_head_id', '');
            onChange('office_head_name', '');
            onChange('office_head_designation', '');
            return;
        }

        onChange('office_head_id', option.value);
        onChange('office_head_name', '');
        onChange('office_head_designation', option.head?.designation || '');
    };

    const handleCreateHead = (customName: string) => {
        const cleanName = customName.trim();
        setIsManualMode(true);
        onChange('office_head_id', '');
        onChange('office_head_name', cleanName);
        onChange('office_head_designation', '');
    };

    const toggleManualMode = (manual: boolean) => {
        setIsManualMode(manual);
        if (manual) {
            onChange('office_head_id', '');
            if (!data.office_head_name && head) {
                onChange('office_head_name', head.name);
                onChange('office_head_designation', head.designation || '');
            }
        } else {
            onChange('office_head_name', '');
            if (data.department && departmentHeads[data.department]) {
                const autoId = String(departmentHeads[data.department]);
                onChange('office_head_id', autoId);
                const h = officeHeads.find(item => String(item.id) === autoId);
                onChange('office_head_designation', h?.designation || '');
            } else {
                onChange('office_head_id', '');
                onChange('office_head_designation', '');
            }
        }
    };

    const headErrorMessage = errors.office_head_id || errors.office_head_name;

    return (
        <fieldset className="min-w-0 space-y-5 text-slate-700 dark:text-slate-300">
            <legend className="font-semibold text-slate-900 dark:text-slate-100">
                {isAuthorizedPersonnel ? 'Office & Designation details' : 'Delivery Unit assignment'}
            </legend>
            <p className="pt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {isAuthorizedPersonnel
                    ? 'Enter the department/office and designation of the Authorized Personnel. Department head assignment is optional.'
                    : required
                    ? 'Select a Delivery Unit and office head. These details fill the requesting office on supply requests.'
                    : 'Delivery Unit assignment is optional for this role. When assigned, the Delivery Unit can prefill the request form.'}
            </p>

            {isAuthorizedPersonnel ? (
                <>
                    {/* Department / Office */}
                    <div>
                        <label htmlFor="staff-department" className="block text-sm font-semibold mb-1">
                            Department / Office <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                        <CreatableSelect<{ value: string; label: string }, false>
                            {...selectLayout}
                            inputId="staff-department"
                            name="department"
                            required
                            value={data.department ? { value: data.department, label: data.department } : null}
                            options={departments.map(name => ({ value: name, label: name }))}
                            onChange={option => selectDepartment(option?.value || '')}
                            onCreateOption={value => selectDepartment(value.trim().slice(0, 255))}
                            formatCreateLabel={value => `Use “${value}”`}
                            styles={selectStyles(Boolean(errors.department))}
                            isClearable
                            isSearchable
                            placeholder="Search or enter department / office"
                        />
                        {errors.department && (
                            <p role="alert" className="text-sm text-red-600 mt-1 dark:text-red-300">{errors.department}</p>
                        )}
                    </div>

                    {/* Designation of Authorized Personnel */}
                    <div>
                        <label htmlFor="staff-authorized-designation" className="block text-sm font-semibold mb-1">
                            Designation <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                        <input aria-invalid={Boolean(errors.designation)}
                            id="staff-authorized-designation"
                            type="text"
                            name="designation"
                            value={data.designation || ''}
                            onChange={e => onChange('designation', e.target.value)}
                            placeholder="e.g. Instructor I, Assistant Professor, Research Associate, Admin Officer"
                            className={"ui-field " + (`${inputClass} ${errors.designation ? "border-red-500" : ""}`)}
                            required
                        />
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Official position / designation of the authorized personnel.
                        </p>
                        {errors.designation && (
                            <p role="alert" className="text-sm text-red-600 mt-1 dark:text-red-300">{errors.designation}</p>
                        )}
                    </div>

                    {/* Optional Department Head for Authorized Personnel */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Department / Office Head (Optional)
                            </span>
                            <Button variant="ghost"
                                type="button"
                                onClick={() => setShowOptionalHead(!showOptionalHead)}
                                className="min-h-0 h-auto py-1 px-2 text-sm text-red-900 dark:text-red-300 hover:text-red-950 dark:hover:text-red-200 inline-flex items-center gap-1 font-medium"
                            >
                                {showOptionalHead ? 'Hide optional head' : '+ Assign office head (optional)'}
                            </Button>
                        </div>

                        {showOptionalHead && (
                            <div className="space-y-4 p-3 bg-slate-50/70 dark:bg-slate-850/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                                        <label htmlFor="staff-office-head" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Department Head (Optional)
                                        </label>
                                        <Button variant="ghost"
                                            type="button"
                                            onClick={() => toggleManualMode(!isManualMode)}
                                            className="min-h-0 h-auto py-1 px-2 text-sm text-red-900 dark:text-red-300 hover:text-red-950 dark:hover:text-red-200 inline-flex items-center gap-1 font-medium"
                                        >
                                            {isManualMode ? 'Choose from list' : 'Enter head manually'}
                                        </Button>
                                    </div>

                                    {isManualMode ? (
                                        <input
                                            id="staff-office-head-name"
                                            type="text"
                                            value={data.office_head_name || ''}
                                            onChange={e => onChange('office_head_name', e.target.value)}
                                            placeholder="Enter full name of office head"
                                            className={"ui-field " + (`${inputClass} text-sm`)}
                                        />
                                    ) : (
                                        <CreatableSelect<{ value: string; label: string; head?: OfficeHead }, false>
                                            {...selectLayout}
                                            inputId="staff-office-head"
                                            name="office_head_id"
                                            options={headOptions}
                                            value={headOptions.find(option => option.value === data.office_head_id) || null}
                                            onChange={handleSelectHead}
                                            onCreateOption={handleCreateHead}
                                            formatCreateLabel={value => `Enter “${value}” as new head`}
                                            styles={selectStyles(Boolean(headErrorMessage))}
                                            isSearchable
                                            isClearable
                                            placeholder="Search for an office head..."
                                        />
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="staff-head-designation" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Head’s Designation (Optional)
                                    </label>
                                    {isManualMode ? (
                                        <input
                                            id="staff-head-designation"
                                            type="text"
                                            value={data.office_head_designation || ''}
                                            onChange={e => onChange('office_head_designation', e.target.value)}
                                            placeholder="e.g. Dean, Department Head"
                                            className={"ui-field " + (`${inputClass} text-sm`)}
                                        />
                                    ) : (
                                        <input
                                            id="staff-head-designation"
                                            type="text"
                                            value={head?.designation || data.office_head_designation || ''}
                                            readOnly
                                            placeholder="Select an office head to display designation"
                                            className={"ui-field " + (`${inputClass} text-sm bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed`)}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Department / Delivery Unit */}
                    <div>
                        <label htmlFor="staff-department" className="block text-sm font-semibold mb-1">
                            Department / Delivery Unit {required && '*'}
                        </label>
                        <CreatableSelect<{ value: string; label: string }, false>
                            {...selectLayout}
                            inputId="staff-department"
                            name="department"
                            required={required}
                            value={data.department ? { value: data.department, label: data.department } : null}
                            options={departments.map(name => ({ value: name, label: name }))}
                            onChange={option => selectDepartment(option?.value || '')}
                            onCreateOption={value => selectDepartment(value.trim().slice(0, 255))}
                            formatCreateLabel={value => `Use “${value}”`}
                            styles={selectStyles(Boolean(errors.department))}
                            isClearable
                            isSearchable
                            placeholder="Search or enter a department"
                        />
                        {errors.department && (
                            <p role="alert" className="text-sm text-red-600 mt-1 dark:text-red-300">{errors.department}</p>
                        )}
                    </div>

                    {/* Department / Office Head */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                            <label htmlFor="staff-office-head" className="block text-sm font-semibold">
                                Department / Office Head {required && '*'}
                            </label>
                            <Button variant="ghost"
                                type="button"
                                onClick={() => toggleManualMode(!isManualMode)}
                                className="min-h-0 h-auto py-1 px-2 text-sm text-red-900 dark:text-red-300 hover:text-red-950 dark:hover:text-red-200 inline-flex items-center gap-1 font-medium"
                            >
                                {isManualMode ? (
                                    <>
                                        <ListFilter className="w-3.5 h-3.5" />
                                        <span>Choose from list</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Enter head manually</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {isManualMode ? (
                            <div className="space-y-1.5">
                                <input aria-invalid={Boolean(headErrorMessage)}
                                    id="staff-office-head-name"
                                    type="text"
                                    value={data.office_head_name || ''}
                                    onChange={e => onChange('office_head_name', e.target.value)}
                                    placeholder="Enter full name of office head (e.g. Dr. Juan Dela Cruz)"
                                    className={"ui-field " + (`${inputClass} ${headErrorMessage ? "border-red-500" : ""}`)}
                                    required={required}
                                    autoFocus
                                />
                                <p className="text-sm text-amber-800 dark:text-amber-400">
                                    Entering a new office head will register them for this department upon saving.
                                </p>
                            </div>
                        ) : (
                            <CreatableSelect<{ value: string; label: string; head?: OfficeHead }, false>
                                {...selectLayout}
                                inputId="staff-office-head"
                                name="office_head_id"
                                required={required && !data.office_head_name}
                                options={headOptions}
                                value={headOptions.find(option => option.value === data.office_head_id) || null}
                                onChange={handleSelectHead}
                                onCreateOption={handleCreateHead}
                                formatCreateLabel={value => `Enter “${value}” as new head`}
                                styles={selectStyles(Boolean(headErrorMessage))}
                                isSearchable
                                isClearable
                                placeholder="Search for an office head or type new name..."
                            />
                        )}

                        {headErrorMessage && (
                            <p role="alert" className="text-sm text-red-600 mt-1 dark:text-red-300">{headErrorMessage}</p>
                        )}
                    </div>

                    {/* Head's Designation */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="staff-head-designation" className="block text-sm font-semibold">
                                Head’s Designation {required && (isManualMode || Boolean(data.office_head_name)) && '*'}
                            </label>
                            {!isManualMode && head && (
                                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Linked to official</span>
                                </span>
                            )}
                        </div>

                        {isManualMode ? (
                            <input aria-invalid={Boolean(errors.office_head_designation)}
                                id="staff-head-designation"
                                type="text"
                                value={data.office_head_designation || ''}
                                onChange={e => onChange('office_head_designation', e.target.value)}
                                placeholder="e.g. Dean, Department Head, Director, Division Chief"
                                className={"ui-field " + (`${inputClass} ${errors.office_head_designation ? "border-red-500" : ""}`)}
                                required={required && Boolean(data.office_head_name)}
                            />
                        ) : (
                            <input
                                id="staff-head-designation"
                                type="text"
                                value={head?.designation || data.office_head_designation || ''}
                                readOnly
                                placeholder="Select an office head above to display designation"
                                className={"ui-field " + (`${inputClass} bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed`)}
                            />
                        )}

                        {errors.office_head_designation && (
                            <p role="alert" className="text-sm text-red-600 mt-1 dark:text-red-300">{errors.office_head_designation}</p>
                        )}
                    </div>

                    {head && !head.is_active && !isManualMode && (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            This head is inactive. Select an active head before the coordinator can submit new requests.
                        </p>
                    )}
                </>
            )}
        </fieldset>
    );
}
