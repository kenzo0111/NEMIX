import React from 'react';
import { Search } from 'lucide-react';
import { Staff } from '../types';
import StaffTableRow from './StaffTableRow';

interface StaffTableProps {
    staffs: Staff[];
    totalStaffCount: number;
    currentUserId?: number;
    canEdit: boolean;
    canToggleStatus: boolean;
    canResendInvite: boolean;
    resendingStaffId: number | null;
    searchQuery: string;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    onEdit: (staff: Staff) => void;
    onToggleStatus: (staff: Staff) => void;
    onResendInvitation: (staff: Staff) => void;
}

export default function StaffTable({
    staffs,
    totalStaffCount,
    currentUserId,
    canEdit,
    canToggleStatus,
    canResendInvite,
    resendingStaffId,
    searchQuery,
    hasActiveFilters,
    onResetFilters,
    onEdit,
    onToggleStatus,
    onResendInvitation,
}: StaffTableProps) {
    return (
        <section aria-label="Staff accounts roster" className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 text-[11px] font-semibold tracking-wider text-gray-600 dark:text-slate-300 uppercase">
                            <th scope="col" className="px-6 py-3.5 w-4/12">
                                Staff Member
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-3/12">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-2/12">
                                Verification
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-2/12">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-2/12 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {staffs.length > 0 ? (
                            staffs.map((staff) => (
                                <StaffTableRow
                                    key={staff.id}
                                    staff={staff}
                                    currentUserId={currentUserId}
                                    canEdit={canEdit}
                                    canToggleStatus={canToggleStatus}
                                    canResendInvite={canResendInvite}
                                    isResending={resendingStaffId === staff.id}
                                    onEdit={onEdit}
                                    onToggleStatus={onToggleStatus}
                                    onResendInvitation={onResendInvitation}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-14 text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center mb-3">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                            No staff accounts found
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                                            {hasActiveFilters
                                                ? 'No staff members match the current search or status filter criteria.'
                                                : 'There are currently no staff accounts registered in the system.'}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={onResetFilters}
                                                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-700 border border-red-900/30 dark:border-red-800/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                            >
                                                Clear search and filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400">
                <span>
                    Showing <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{staffs.length}</span> of{' '}
                    <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{totalStaffCount}</span> staff accounts
                </span>
                {hasActiveFilters && (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 px-2 py-0.5 rounded-md">
                        Filtered Roster
                    </span>
                )}
            </div>
        </section>
    );
}
