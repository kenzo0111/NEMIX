import React from 'react';
import { Shield, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { Staff } from '../types';

interface StaffTableRowProps {
    staff: Staff;
    currentUserId?: number;
    canEdit: boolean;
    canToggleStatus: boolean;
    canResendInvite: boolean;
    isResending: boolean;
    onEdit: (staff: Staff) => void;
    onToggleStatus: (staff: Staff) => void;
    onResendInvitation: (staff: Staff) => void;
}

export default function StaffTableRow({
    staff,
    currentUserId,
    canEdit,
    canToggleStatus,
    canResendInvite,
    isResending,
    onEdit,
    onToggleStatus,
    onResendInvitation,
}: StaffTableRowProps) {
    const { isSystemAdmin: currentUserIsAdmin } = useAuthorization();
    const isActive = staff.status === 'Active';
    const isSelf = staff.id === currentUserId;
    const targetIsSystemAdmin = Boolean(
        staff.is_system_admin ||
        staff.role.toLowerCase() === 'system admin' ||
        staff.role.toLowerCase() === 'system administrator'
    );
    const isAuditor = staff.role.toLowerCase().includes('auditor');

    // Target-level capability enforcement: Non-admins cannot mutate System Admin accounts
    const canEditTarget = canEdit && (currentUserIsAdmin || !targetIsSystemAdmin);
    const canToggleTarget = canToggleStatus && !isSelf && (currentUserIsAdmin || !targetIsSystemAdmin);
    const canResendInviteTarget = canResendInvite && (currentUserIsAdmin || !targetIsSystemAdmin);

    const hasAnyAction = canEditTarget || canToggleTarget || ((!isActive || !staff.email_verified) && canResendInviteTarget);

    // Deterministic avatar styling by role
    const avatarColor = targetIsSystemAdmin
        ? 'bg-red-50 dark:bg-red-950/50 text-red-950 dark:text-red-300 border-red-200/80 dark:border-red-900/40'
        : isAuditor
        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-0 group">
            {/* Staff Member */}
            <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border ${avatarColor}`}
                    >
                        {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                                {staff.name}
                            </span>
                            {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-200/70 dark:border-red-900/40">
                                    You
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-mono truncate">
                            {staff.email}
                        </span>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-6 py-3.5">
                {targetIsSystemAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-300 border border-red-200/80 dark:border-red-900/40">
                        <Shield className="w-3 h-3 text-red-900 dark:text-red-400 shrink-0" />
                        {staff.is_system_admin ? 'System Admin' : staff.role}
                    </span>
                ) : isAuditor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                        <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                        {staff.role}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
                        {staff.role}
                    </span>
                )}
            </td>

            {/* Verification Status */}
            <td className="px-6 py-3.5">
                {staff.email_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        Pending Invite
                    </span>
                )}
            </td>

            {/* Account Status */}
            <td className="px-6 py-3.5">
                {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-slate-500 shrink-0"></span>
                        Disabled
                    </span>
                )}
            </td>

            {/* Actions: Matching standard institutional styling */}
            <td className="px-6 py-3.5 whitespace-nowrap text-right">
                <div className="inline-flex items-center justify-end gap-2.5">
                    {/* Resend Invite (for disabled/unverified accounts) */}
                    {(!isActive || !staff.email_verified) && canResendInviteTarget && (
                        <button
                            type="button"
                            onClick={() => onResendInvitation(staff)}
                            disabled={isResending}
                            className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Resend registration invitation email"
                        >
                            {isResending ? 'Sending...' : 'Resend Invite'}
                        </button>
                    )}

                    {/* Edit Staff */}
                    {canEditTarget && (
                        <button
                            type="button"
                            onClick={() => onEdit(staff)}
                            className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                            title="Edit staff details and role"
                        >
                            Edit
                        </button>
                    )}

                    {/* Toggle Status (Enable / Disable) */}
                    {canToggleTarget && (
                        <button
                            type="button"
                            onClick={() => onToggleStatus(staff)}
                            title={isActive ? 'Disable staff account' : 'Enable staff account'}
                            className="border font-semibold text-xs px-2.5 py-1 rounded transition-colors shadow-2xs border-red-900/30 dark:border-red-800/50 text-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-700 cursor-pointer"
                        >
                            {isActive ? 'Disable' : 'Enable'}
                        </button>
                    )}

                    {/* Minimal placeholder when no actions permitted for this account */}
                    {!hasAnyAction && (
                        <span className="text-xs text-gray-400 dark:text-slate-600 select-none px-2">—</span>
                    )}
                </div>
            </td>
        </tr>
    );
}

