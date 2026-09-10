import React from 'react';
import { Shield } from 'lucide-react';
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
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 group">
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

            {/* Actions: Matching Issuance institutional styling */}
            <td className="px-6 py-3.5 whitespace-nowrap text-right">
                <div className="inline-flex items-center justify-end gap-2.5">
                    {/* Resend Invite (for disabled/inactive accounts) */}
                    {!isActive && canResendInvite && (
                        <button
                            type="button"
                            onClick={() => onResendInvitation(staff)}
                            disabled={isResending}
                            className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
                            className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
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
                            title={isSelf ? 'You cannot disable your own account.' : isActive ? 'Disable staff account' : 'Enable staff account'}
                            className={`border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs ${
                                isSelf
                                    ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50 hover:bg-gray-50 hover:border-gray-200'
                                    : ''
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
