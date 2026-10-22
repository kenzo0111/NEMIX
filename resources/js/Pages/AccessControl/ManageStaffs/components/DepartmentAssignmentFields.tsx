import { usePage } from '@inertiajs/react';

type Assignment = { department: string; office_head_id: string };
type OfficeHead = { id: number; name: string; designation: string | null; department: string | null; office: string | null; is_active: boolean };

export default function DepartmentAssignmentFields({ data, onChange, errors, required }: {
    data: Assignment;
    onChange: (field: keyof Assignment, value: string) => void;
    errors: Partial<Record<keyof Assignment, string>>;
    required: boolean;
}) {
    const { departments = [], officeHeads = [] } = usePage().props as unknown as { departments: string[]; officeHeads: OfficeHead[] };
    const head = officeHeads.find(head => String(head.id) === data.office_head_id);
    const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm';

    return <fieldset className="space-y-3 border-t border-gray-200 dark:border-slate-700 pt-4 text-gray-700 dark:text-slate-300">
        <legend className="font-semibold text-sm text-gray-900 dark:text-slate-100">Delivery Unit assignment</legend>
        <p className="text-sm text-gray-500 dark:text-slate-400">The office head and designation automatically appear as Requested by on supply requests. Manage heads in the Signatory Directory under System Settings.</p>
        <div>
            <label htmlFor="staff-department" className="block text-sm font-semibold mb-1">Department / Delivery Unit {required && '*'}</label>
            <input id="staff-department" list="staff-departments" value={data.department} required={required} maxLength={255}
                onChange={event => onChange('department', event.target.value)} className={inputClass} placeholder="Select or enter the assigned department" />
            <datalist id="staff-departments">{departments.map(name => <option key={name} value={name} />)}</datalist>
            {errors.department && <p role="alert" className="text-sm text-red-600 mt-1">{errors.department}</p>}
        </div>
        <div>
            <label htmlFor="staff-office-head" className="block text-sm font-semibold mb-1">Department / Office Head {required && '*'}</label>
            <select id="staff-office-head" value={data.office_head_id} required={required} onChange={event => onChange('office_head_id', event.target.value)} className={inputClass}>
                <option value="">Select an office head</option>
                {officeHeads.filter(head => (head.is_active && head.designation?.trim()) || String(head.id) === data.office_head_id).map(head =>
                    <option key={head.id} value={head.id}>{head.name} — {head.designation}{head.department || head.office ? ` · ${head.department || head.office}` : ''}{!head.is_active ? ' (inactive)' : ''}</option>)}
            </select>
            {errors.office_head_id && <p role="alert" className="text-sm text-red-600 mt-1">{errors.office_head_id}</p>}
        </div>
        <div>
            <label htmlFor="staff-head-designation" className="block text-sm font-semibold mb-1">Head’s Designation</label>
            <input id="staff-head-designation" value={head?.designation || ''} readOnly className={`${inputClass} bg-gray-50 dark:bg-slate-800`} />
        </div>
        {head && !head.is_active && <p className="text-sm text-amber-700 dark:text-amber-400">This head is inactive. Select an active head before the coordinator can submit new requests.</p>}
    </fieldset>;
}
