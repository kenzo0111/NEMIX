import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React from 'react';
import { Shield, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Staff } from '../types';

interface StaffTableRowProps {
    staff: Staff;
    currentUserId?: number;
    selected: boolean;
    onSelect: (staff: Staff) => void;
}

export default function StaffTableRow({
    staff,
    currentUserId,
    selected,
    onSelect,
}: StaffTableRowProps) {
    const isActive = staff.status === 'Active';
    const isSelf = staff.id === currentUserId;
    const targetIsSystemAdmin = Boolean(
        staff.is_system_admin ||
        staff.role.toLowerCase() === 'system admin' ||
        staff.role.toLowerCase() === 'system administrator'
    );
    const isAuditor = staff.role.toLowerCase().includes('auditor');

    // Deterministic avatar styling by role
    const avatarColor = targetIsSystemAdmin
        ? 'bg-red-50 dark:bg-red-950/50 text-red-950 dark:text-red-300 border-red-200/80 dark:border-red-900/40'
        : isAuditor
        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

    return (
        <tr   {...rowSelectionProps(selected, () => onSelect(staff))}  className={`cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800 last:border-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${selected ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}>
            {/* Staff Member */}
            <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-sm shrink-0 border ${avatarColor}`}
                    >
                        {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                                {staff.name}
                            </span>
                            {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-sm font-bold normal-case tracking-normal bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-200/70 dark:border-red-900/40">
                                    You
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-slate-400 tabular-nums truncate">
                            {staff.email}
                        </span>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-6 py-3.5">
                {targetIsSystemAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-300 border border-red-200/80 dark:border-red-900/40">
                        <Shield className="w-3 h-3 text-red-900 dark:text-red-400 shrink-0" />
                        {staff.is_system_admin ? 'System Admin' : staff.role}
                    </span>
                ) : isAuditor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                        <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                        {staff.role}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
                        {staff.role}
                    </span>
                )}
            </td>

            {/* Delivery Unit */}
            <td className="px-6 py-3.5 text-sm text-gray-700 dark:text-slate-300">
                <span className="font-semibold">{staff.department || 'Unassigned'}</span>
                {staff.office_head && <span className="block text-xs text-gray-500 dark:text-slate-400">Head: {staff.office_head.name}<br />{staff.office_head.designation}</span>}
            </td>

            {/* Verification Status */}
            <td className="px-6 py-3.5">
                {staff.email_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        Pending Invite
                    </span>
                )}
            </td>

            {/* Account Status */}
            <td className="px-6 py-3.5">
                {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-slate-500 shrink-0"></span>
                        Disabled
                    </span>
                )}
            </td>

        </tr>
    );
}

