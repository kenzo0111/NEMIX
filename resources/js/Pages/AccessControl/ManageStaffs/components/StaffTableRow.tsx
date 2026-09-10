import React from 'react';
import { Mail, Edit2, UserCheck, UserX, Shield } from 'lucide-react';
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

    return (
        <tr className="hover:bg-gray-50/75 transition-colors border-b border-gray-200/80">
            {/* Staff Member */}
            <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                        {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-gray-900 text-sm truncate">{staff.name}</span>
                        <span className="text-xs text-gray-500 font-mono truncate">{staff.email}</span>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-6 py-3.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    {staff.role}
                </span>
            </td>

            {/* Status */}
            <td className="px-6 py-3.5">
                {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span>
                        Disabled
                    </span>
                )}
            </td>

            {/* Actions */}
            <td className="px-6 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                    {/* Resend Invite (for disabled/inactive accounts) */}
                    {!isActive && canResendInvite && (
                        <button
                            type="button"
                            onClick={() => onResendInvitation(staff)}
                            disabled={isResending}
                            className="px-2.5 py-1 text-xs font-medium rounded text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Resend registration invitation email"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{isResending ? 'Sending...' : 'Resend Invite'}</span>
                        </button>
                    )}

                    {/* Edit Staff */}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(staff)}
                            className="px-2.5 py-1 text-xs font-medium rounded text-gray-700 hover:text-red-900 bg-white hover:bg-red-50/60 border border-gray-300 transition-colors inline-flex items-center gap-1.5"
                            title="Edit staff details and role"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                        </button>
                    )}

                    {/* Toggle Status (Enable / Disable) */}
                    {canToggleStatus && (
                        <button
                            type="button"
                            onClick={() => onToggleStatus(staff)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot disable your own account.' : isActive ? 'Disable staff account' : 'Enable staff account'}
                            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors inline-flex items-center gap-1.5 ${
                                isSelf
                                    ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-50 border-gray-200'
                                    : isActive
                                    ? 'text-red-700 hover:text-red-800 bg-white hover:bg-red-50/80 border-red-200'
                                    : 'text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50/80 border-emerald-200'
                            }`}
                        >
                            {isActive ? (
                                <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Disable</span>
                                </>
                            ) : (
                                <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Enable</span>
                                </>
                            )}
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
