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
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold tracking-wider text-gray-700 uppercase">
                            <th scope="col" className="px-6 py-3 w-5/12">
                                Staff Member
                            </th>
                            <th scope="col" className="px-6 py-3 w-3/12">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 w-2/12">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 w-2/12 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/80 bg-white">
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
                                <td colSpan={4} className="px-6 py-14 text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            No staff accounts found
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {hasActiveFilters
                                                ? 'No staff members match the current search or status filter criteria.'
                                                : 'There are currently no staff accounts registered in the system.'}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={onResetFilters}
                                                className="mt-4 px-3 py-1.5 text-xs font-semibold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
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
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
                <span>
                    Showing <span className="font-semibold text-gray-700">{staffs.length}</span> of{' '}
                    <span className="font-semibold text-gray-700">{totalStaffCount}</span> staff accounts
                </span>
            </div>
        </div>
    );
}
