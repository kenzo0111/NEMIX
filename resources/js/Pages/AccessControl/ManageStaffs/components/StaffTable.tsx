import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Staff, StaffSortKey } from '../types';
import StaffTableRow from './StaffTableRow';
import type { SortDirection } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import RecordDetailsModal from '@/Components/ui/record-details-modal';
import useAuthorization from '@/Hooks/useAuthorization';

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
    sortKey: StaffSortKey;
    sortDirection: SortDirection;
    onSort: (key: StaffSortKey) => void;
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
    sortKey,
    sortDirection,
    onSort,
}: StaffTableProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selectedStaff = staffs.find((staff) => staff.id === selectedId) || null;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { isSystemAdmin: currentUserIsAdmin } = useAuthorization();
    useEffect(() => {
        if (selectedId !== null && !staffs.some((staff) => staff.id === selectedId)) setSelectedId(null);
    }, [selectedId, staffs]);
    const targetIsSystemAdmin = Boolean(selectedStaff && (selectedStaff.is_system_admin || ['system admin', 'system administrator'].includes(selectedStaff.role.toLowerCase())));
    const targetCanMutate = Boolean(selectedStaff && (currentUserIsAdmin || !targetIsSystemAdmin));
    const canToggleSelected = Boolean(selectedStaff && canToggleStatus && selectedStaff.id !== currentUserId && targetCanMutate);
    const canResendSelected = Boolean(selectedStaff && canResendInvite && (!selectedStaff.email_verified || selectedStaff.status !== 'Active') && targetCanMutate);
    return (
        <section data-tour="system-admin-staff-directory" aria-label="Staff accounts roster" className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col">
            <TableSelectionAction selectedLabel={selectedStaff ? `${selectedStaff.name} — ${selectedStaff.role}` : null} actionLabel={canEdit || canToggleStatus || canResendInvite ? 'Manage selected' : 'View selected'} onAction={() => setDetailsOpen(true)} />
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 text-sm font-semibold tracking-normal text-gray-600 dark:text-slate-300 normal-case">
                            <SortableTableHeader column="name" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5 w-4/12">
                                Staff Member
                            </SortableTableHeader>
                            <SortableTableHeader column="role" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5">
                                Role
                            </SortableTableHeader>
                            <SortableTableHeader column="department" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5">Delivery Unit / Office Head</SortableTableHeader>
                            <SortableTableHeader column="verification" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5">
                                Verification
                            </SortableTableHeader>
                            <SortableTableHeader column="status" activeColumn={sortKey} direction={sortDirection} onSort={onSort} className="px-6 py-3.5">
                                Status
                            </SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {staffs.length > 0 ? (
                            staffs.map((staff) => (
                                <StaffTableRow
                                    key={staff.id}
                                    staff={staff}
                                    currentUserId={currentUserId}
                                    selected={staff.id === selectedId}
                                    onSelect={(row) => setSelectedId(row.id)}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-14 text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40 flex items-center justify-center mb-3">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <p className="leading-relaxed text-sm font-semibold text-gray-900 dark:text-slate-100">
                                            No staff accounts found
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                                            {hasActiveFilters
                                                ? 'No staff members match the current search or status filter criteria.'
                                                : 'There are currently no staff accounts registered in the system.'}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={onResetFilters}
                                                className="mt-4 px-3.5 py-1.5 text-sm font-semibold text-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-700 border border-red-900/30 dark:border-red-800/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
            <div className="px-4 sm:px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-slate-400">
                <span>
                    Showing <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{staffs.length}</span> of{' '}
                    <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{totalStaffCount}</span> staff accounts
                </span>
                {hasActiveFilters && (
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 px-2 py-0.5 rounded-md">
                        Filtered Roster
                    </span>
                )}
            </div>
            <RecordDetailsModal show={detailsOpen && Boolean(selectedStaff)} title="Staff account details" description={selectedStaff?.name} onClose={() => setDetailsOpen(false)} actions={selectedStaff && <>
                {canEdit && targetCanMutate && <button type="button" onClick={() => { setDetailsOpen(false); onEdit(selectedStaff); }} className="rounded-lg bg-red-950 px-4 text-sm font-semibold text-white hover:bg-red-900">Edit staff details</button>}
                {canToggleSelected && <button type="button" onClick={() => { setDetailsOpen(false); onToggleStatus(selectedStaff); }} className="rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-900 hover:bg-red-50 dark:border-red-900 dark:text-red-300">{selectedStaff.status === 'Active' ? 'Disable account' : 'Enable account'}</button>}
                {canResendSelected && <button type="button" disabled={resendingStaffId === selectedStaff.id} onClick={() => onResendInvitation(selectedStaff)} className="rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">{resendingStaffId === selectedStaff.id ? 'Sending invitation…' : 'Resend invitation'}</button>}
            </>}>
                {selectedStaff && <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                        ['Name', selectedStaff.name], ['Email', selectedStaff.email], ['Role', selectedStaff.role],
                        ['Delivery Unit', selectedStaff.department || 'Not assigned'],
                        ['Office Head', selectedStaff.office_head?.name || 'Not assigned'],
                        ['Verification', selectedStaff.email_verified ? 'Verified' : 'Unverified'], ['Status', selectedStaff.status],
                    ].map(([label, value]) => <div key={label}><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">{value}</dd></div>)}
                </dl>}
            </RecordDetailsModal>
        </section>
    );
}
