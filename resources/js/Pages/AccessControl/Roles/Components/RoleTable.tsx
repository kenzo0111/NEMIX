import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Shield, ShieldCheck, Lock, Users } from 'lucide-react';
import { Role } from '../types';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import RecordDetailsModal from '@/Components/ui/record-details-modal';

type RoleSortKey = 'name' | 'permissions' | 'type';

interface RoleTableProps {
    roles: Role[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    onCreateRole: () => void;
    onEditRole: (role: Role) => void;
    onDeleteRole: (role: Role) => void;
}

export default function RoleTable({
    roles,
    searchQuery,
    onSearchChange,
    canCreate,
    canUpdate,
    canDelete,
    onCreateRole,
    onEditRole,
    onDeleteRole,
}: RoleTableProps) {
    const accessors = useMemo(() => ({
        name: (role: Role) => role.name,
        permissions: (role: Role) => role.permissions_count ?? role.permissions?.length ?? 0,
        type: (role: Role) => role.is_system ? 'system' : 'custom',
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData<Role, RoleSortKey>(roles, accessors, { key: 'name', direction: 'asc' });
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selectedRole = sortedRows.find((role) => role.id === selectedId) || null;
    const [detailsOpen, setDetailsOpen] = useState(false);
    useEffect(() => {
        if (selectedId !== null && !roles.some((role) => role.id === selectedId)) setSelectedId(null);
    }, [roles, selectedId]);
    return (
        <section
            data-tour="system-admin-role-directory"
            aria-labelledby="roles-heading"
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col"
        >
            {/* Header with Search and Create Action */}
            <div className="table-toolbar p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                <div className="min-w-0">
                    <h2
                        id="roles-heading"
                        className="text-xl font-bold text-gray-900 dark:text-slate-100 truncate"
                    >
                        Configured Roles
                    </h2>
                    <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Choose a role to review and change what its staff can do.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64 min-w-0 flex-1 sm:flex-initial">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search roles..."
                            aria-label="Search roles"
                            className="w-full pl-8 pr-7 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-2xs"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-sm font-bold cursor-pointer"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={onCreateRole}
                            className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-semibold py-2 px-4 rounded-lg shadow-2xs transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-amber-300" />
                            <span>Create Role</span>
                        </button>
                    )}
                </div>
            </div>

            <TableSelectionAction selectedLabel={selectedRole?.name} actionLabel={canUpdate || canDelete ? 'Manage selected' : 'View selected'} onAction={() => setDetailsOpen(true)} />

            {/* Table */}
            <div className="overflow-x-auto flex-1 min-w-full">
                <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-800/90 text-sm font-semibold tracking-normal text-gray-600 dark:text-slate-300 normal-case">
                            <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 w-2/5">
                                Role
                            </SortableTableHeader>
                            <SortableTableHeader column="permissions" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 w-1/4">
                                Access granted
                            </SortableTableHeader>
                            <SortableTableHeader column="type" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 w-1/6">
                                Type
                            </SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/80 dark:divide-slate-800 text-sm">
                        {sortedRows.length > 0 ? (
                            sortedRows.map((role) => {
                                const assignedCount =
                                    role.permissions_count ?? role.permissions?.length ?? 0;
                                const isSystem = role.is_system;

                                return (
                                    <tr
                                        key={role.id}
                                        
                                        
                                        {...rowSelectionProps(role.id === selectedId, () => setSelectedId(role.id))}
                                        
                                        className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${role.id === selectedId ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}
                                    >
                                        {/* Role Name, Icon & Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        isSystem
                                                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                            : 'bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-300'
                                                    }`}
                                                >
                                                    {isSystem ? (
                                                        <ShieldCheck className="w-4 h-4" />
                                                    ) : (
                                                        <Shield className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
                                                        {role.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400 dark:text-slate-500">
                                                        <span className="tabular-nums">
                                                            Role #{role.id}
                                                        </span>
                                                        {role.users_count !== undefined && (
                                                            <>
                                                                <span className="text-gray-300 dark:text-slate-600">•</span>
                                                                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400 font-medium">
                                                                    <Users className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                                                    {role.users_count}{' '}
                                                                    {role.users_count === 1 ? 'user' : 'users'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Permissions Count */}
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-800 dark:text-slate-200 tabular-nums">
                                                {assignedCount} {assignedCount === 1 ? 'permission' : 'permissions'}
                                            </span>
                                        </td>

                                        {/* Role Type */}
                                        <td className="px-6 py-4">
                                            {isSystem ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    System Role
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-slate-500"></span>
                                                    Custom Role
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                        <p className="leading-relaxed font-semibold text-gray-700 dark:text-slate-300 text-sm">
                                            No roles match your search criteria.
                                        </p>
                                        <p className="leading-relaxed text-sm text-gray-400 dark:text-slate-500">
                                            Try adjusting your keywords or clearing the filter.
                                        </p>
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => onSearchChange('')}
                                                className="mt-2 px-3 py-1.5 text-sm font-semibold text-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-900/30 dark:border-red-800/50 rounded-md transition-colors cursor-pointer"
                                            >
                                                Clear search query
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer count */}
            <div className="px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                    Showing <span className="font-semibold text-gray-800 dark:text-slate-200">{roles.length}</span> configured {roles.length === 1 ? 'role' : 'roles'}
                </span>
            </div>
            <RecordDetailsModal show={detailsOpen && Boolean(selectedRole)} title="Role details" description={selectedRole?.name} onClose={() => setDetailsOpen(false)} actions={selectedRole && <>
                {canUpdate && selectedRole.is_editable && <button type="button" onClick={() => { setDetailsOpen(false); onEditRole(selectedRole); }} className="rounded-lg bg-red-950 px-4 text-sm font-semibold text-white hover:bg-red-900">Edit role and permissions</button>}
                {canDelete && !selectedRole.is_system && selectedRole.is_deletable && <button type="button" onClick={() => { setDetailsOpen(false); onDeleteRole(selectedRole); }} className="rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-900 hover:bg-red-50 dark:border-red-900 dark:text-red-300">Delete role</button>}
            </>}>
                {selectedRole && <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                        ['Role', selectedRole.name], ['Type', selectedRole.is_system ? 'System Role' : 'Custom Role'],
                        ['Access granted', String(selectedRole.permissions_count ?? selectedRole.permissions.length) + ' permissions'],
                        ['Assigned staff', String(selectedRole.users_count ?? 0)],
                    ].map(([label, value]) => <div key={label}><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{value}</dd></div>)}
                </dl>}
            </RecordDetailsModal>
        </section>
    );
}

