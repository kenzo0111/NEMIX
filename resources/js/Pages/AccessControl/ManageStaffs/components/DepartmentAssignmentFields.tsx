import { usePage } from '@inertiajs/react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';

type Assignment = { department: string; office_head_id: string };
type OfficeHead = { id: number; name: string; designation: string | null; department: string | null; office: string | null; is_active: boolean };

export default function DepartmentAssignmentFields({ data, onChange, errors, required }: {
    data: Assignment;
    onChange: (field: keyof Assignment, value: string) => void;
    errors: Partial<Record<keyof Assignment, string>>;
    required: boolean;
}) {
    const { departments = [], officeHeads = [], departmentHeads = {} } = usePage().props as unknown as { departments: string[]; officeHeads: OfficeHead[]; departmentHeads: Record<string, number> };
    const selectDepartment = (department: string) => {
        onChange('department', department);
        onChange('office_head_id', departmentHeads[department] ? String(departmentHeads[department]) : '');
    };
    const head = officeHeads.find(head => String(head.id) === data.office_head_id);
    const headOptions = officeHeads
        .filter(head => (head.is_active && head.designation?.trim()) || String(head.id) === data.office_head_id)
        .map(head => ({ value: String(head.id), label: `${head.name} — ${head.designation || ''}${!head.is_active ? ' (inactive)' : ''}` }));
    const selectLayout = {
        menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
        menuPosition: 'fixed' as const,
        menuPlacement: 'auto' as const,
        maxMenuHeight: 200,
    };
    const selectStyles = (hasError: boolean) => ({
        ...getInstitutionalSelectStyles(hasError),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        singleValue: (base: any) => ({ ...base, whiteSpace: 'normal' as const, overflowWrap: 'anywhere' as const, color: 'var(--text-primary, #111827)' }),
    });
    const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm';

    return <fieldset className="min-w-0 space-y-5 text-gray-700 dark:text-slate-300">
        <legend className="font-semibold text-gray-900 dark:text-slate-100">Delivery Unit assignment</legend>
        <p className="pt-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400">Select a college to automatically fill its dean and designation. These details fill Requested by on supply requests.</p>
        <div>
            <label htmlFor="staff-department" className="block text-sm font-semibold mb-1">Department / Delivery Unit {required && '*'}</label>
            <CreatableSelect<{ value: string; label: string }, false> {...selectLayout}
                inputId="staff-department" name="department" required={required}
                value={data.department ? { value: data.department, label: data.department } : null}
                options={departments.map(name => ({ value: name, label: name }))}
                onChange={option => selectDepartment(option?.value || '')}
                onCreateOption={value => selectDepartment(value.trim().slice(0, 255))}
                formatCreateLabel={value => `Use “${value}”`}
                styles={selectStyles(Boolean(errors.department))} isClearable isSearchable
                placeholder="Search or enter a department" />
            {errors.department && <p role="alert" className="text-sm text-red-600 mt-1">{errors.department}</p>}
        </div>
        <div>
            <label htmlFor="staff-office-head" className="block text-sm font-semibold mb-1">Department / Office Head {required && '*'}</label>
            <Select<{ value: string; label: string }, false> {...selectLayout}
                inputId="staff-office-head" name="office_head_id" required={required}
                options={headOptions} value={headOptions.find(option => option.value === data.office_head_id) || null}
                onChange={option => onChange('office_head_id', option?.value || '')}
                styles={selectStyles(Boolean(errors.office_head_id))} isSearchable isClearable
                placeholder="Search for an office head" />
            <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">Manage office heads in System Settings → Signatory Directory.</p>
            {errors.office_head_id && <p role="alert" className="text-sm text-red-600 mt-1">{errors.office_head_id}</p>}
        </div>
        <div>
            <label htmlFor="staff-head-designation" className="block text-sm font-semibold mb-1">Head’s Designation</label>
            <input id="staff-head-designation" value={head?.designation || ''} readOnly className={`${inputClass} bg-gray-50 dark:bg-slate-800`} />
        </div>
        {head && !head.is_active && <p className="text-sm text-amber-700 dark:text-amber-400">This head is inactive. Select an active head before the coordinator can submit new requests.</p>}
    </fieldset>;
}
