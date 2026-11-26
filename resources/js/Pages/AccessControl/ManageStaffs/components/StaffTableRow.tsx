import { Button } from '@/Components/ui/button';
import StatusBadge from '@/Components/ui/status-badge';
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
        <tr className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 group">
            {/* Staff Member */}
            <td className="px-6 py-3.5 align-middle min-w-[12.5rem]">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-9 w-9 rounded-full font-semibold flex items-center justify-center text-sm shrink-0 border ${avatarColor}`}
                    >
                        {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm break-words">
                                {staff.name}
                            </span>
                            {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-sm font-semibold normal-case tracking-normal bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-200/70 dark:border-red-900/40">
                                    You
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                            {staff.email}
                        </span>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-6 py-3.5 align-middle min-w-[8.75rem] whitespace-nowrap">
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {staff.role}
                    </span>
                )}
            </td>

            {/* Delivery Unit / Office Head */}
            <td className="px-6 py-3.5 align-middle text-sm text-slate-600 dark:text-slate-300 min-w-[12.5rem] break-words">
                <span className="font-medium text-slate-900 dark:text-slate-100">{staff.department || '—'}</span>
                {staff.designation && <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{staff.designation}</span>}
                {staff.office_head && <span className="block text-sm text-slate-500 dark:text-slate-400">Head: {staff.office_head.name}<br />{staff.office_head.designation}</span>}
            </td>

            {/* Verification Status */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap">
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
            <td className="px-6 py-3.5 align-middle whitespace-nowrap">
                <StatusBadge tone={isActive ? 'success' : 'neutral'}>
                    {isActive ? 'Active' : 'Disabled'}
                </StatusBadge>
            </td>

            {/* Actions: Direct action buttons */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap min-w-[14rem] text-right">
                <div className="inline-flex items-center justify-end gap-2 shrink-0">
                    {/* Resend Invite */}
                    {(!isActive || !staff.email_verified) && canResendInviteTarget && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onResendInvitation(staff)}
                            disabled={isResending}
                            className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                            title="Resend registration invitation email"
                        >
                            {isResending ? 'Sending...' : 'Resend Invite'}
                        </Button>
                    )}

                    {/* Edit Staff */}
                    {canEditTarget && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onEdit(staff)}
                            className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                            title="Edit staff details and role"
                        >
                            Edit
                        </Button>
                    )}

                    {/* Toggle Status (Enable / Disable) */}
                    {canToggleTarget && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onToggleStatus(staff)}
                            title={isActive ? 'Disable staff account' : 'Enable staff account'}
                            className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                        >
                            {isActive ? 'Disable' : 'Enable'}
                        </Button>
                    )}

                    {/* Minimal placeholder when no actions permitted for this account */}
                    {!hasAnyAction && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 select-none px-2">—</span>
                    )}
                </div>
            </td>
        </tr>
    );
}
