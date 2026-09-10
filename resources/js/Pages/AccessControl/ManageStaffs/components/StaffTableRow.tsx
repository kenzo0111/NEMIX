import React from 'react';
import { Shield, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
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
    const isActive = staff.status === 'Active';
    const isSelf = staff.id === currentUserId;
    const isSystemAdmin = staff.role.toLowerCase().includes('admin');
    const isAuditor = staff.role.toLowerCase().includes('auditor');

    // Deterministic avatar styling by role
    const avatarColor = isSystemAdmin
        ? 'bg-red-50 text-red-950 border-red-200/80'
        : isAuditor
        ? 'bg-amber-50 text-amber-900 border-amber-200/80'
        : 'bg-slate-100 text-slate-800 border-slate-200';

    return (
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 group">
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
                            <span className="font-semibold text-gray-900 text-sm truncate">
                                {staff.name}
                            </span>
                            {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70">
                                    You
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono truncate">
                            {staff.email}
                        </span>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-6 py-3.5">
                {isSystemAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-950 border border-red-200/80">
                        <Shield className="w-3 h-3 text-red-900 shrink-0" />
                        {staff.role}
                    </span>
                ) : isAuditor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                        <ShieldCheck className="w-3 h-3 text-amber-700 shrink-0" />
                        {staff.role}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                        {staff.role}
                    </span>
                )}
            </td>

            {/* Verification Status */}
            <td className="px-6 py-3.5">
                {staff.email_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Pending Invite
                    </span>
                )}
            </td>

            {/* Account Status */}
            <td className="px-6 py-3.5">
                {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                        Disabled
                    </span>
                )}
            </td>

            {/* Actions: Matching standard institutional styling */}
            <td className="px-6 py-3.5 whitespace-nowrap text-right">
                <div className="inline-flex items-center justify-end gap-2.5">
                    {/* Resend Invite (for disabled/unverified accounts) */}
                    {(!isActive || !staff.email_verified) && canResendInvite && (
                        <button
                            type="button"
                            onClick={() => onResendInvitation(staff)}
                            disabled={isResending}
                            className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Resend registration invitation email"
                        >
                            {isResending ? 'Sending...' : 'Resend Invite'}
                        </button>
                    )}

                    {/* Edit Staff */}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(staff)}
                            className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200"
                            title="Edit staff details and role"
                        >
                            Edit
                        </button>
                    )}

                    {/* Toggle Status (Enable / Disable) */}
                    {canToggleStatus && (
                        <button
                            type="button"
                            onClick={() => onToggleStatus(staff)}
                            disabled={isSelf}
                            title={
                                isSelf
                                    ? 'You cannot disable your own account.'
                                    : isActive
                                    ? 'Disable staff account'
                                    : 'Enable staff account'
                            }
                            className={`border font-semibold text-xs px-2.5 py-1 rounded transition-colors shadow-2xs ${
                                isSelf
                                    ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed shadow-none'
                                    : 'border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 cursor-pointer'
                            }`}
                        >
                            {isActive ? 'Disable' : 'Enable'}
                        </button>
                    )}

                    {/* Read-only fallback when no management actions permitted */}
                    {!canEdit && !canToggleStatus && !canResendInvite && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 select-none"
                            title="Read-only directory view"
                        >
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span>Read-only</span>
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

