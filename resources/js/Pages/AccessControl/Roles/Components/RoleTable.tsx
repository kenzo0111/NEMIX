import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import { Plus, Search, Shield, ShieldCheck, Lock, Users, X } from 'lucide-react';
import { Role } from '../types';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

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

    return (
        <section
            data-tour="system-admin-role-directory"
            aria-labelledby="roles-heading"
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col"
        >
            {/* Header with Search and Create Action */}
            <div className="table-toolbar p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                <div className="min-w-0">
                    <h2
                        id="roles-heading"
                        className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate"
                    >
                        Configured Roles
                    </h2>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                            className="ui-field w-full pl-9 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>

                    {canCreate && (
                        <Button variant="primary"
                            type="button"
                            onClick={onCreateRole}
                            className="w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4 text-amber-300" />
                            <span>Create Role</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 min-w-0 w-full">
                <table className="ui-data-table w-full text-left border-collapse min-w-[48rem]">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 text-sm font-semibold tracking-normal text-slate-600 dark:text-slate-300 normal-case">
                            <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 whitespace-nowrap min-w-[12.5rem]">
                                Role
                            </SortableTableHeader>
                            <SortableTableHeader column="permissions" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 whitespace-nowrap min-w-[10rem]">
                                Access granted
                            </SortableTableHeader>
                            <SortableTableHeader column="type" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-6 py-3.5 whitespace-nowrap min-w-[7.5rem]">
                                Type
                            </SortableTableHeader>
                            <th scope="col" className="px-6 py-3.5 text-right whitespace-nowrap min-w-[10rem] text-sm font-semibold tracking-normal text-slate-600 dark:text-slate-300 normal-case">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-sm">
                        {sortedRows.length > 0 ? (
                            sortedRows.map((role) => {
                                const assignedCount =
                                    role.permissions_count ?? role.permissions?.length ?? 0;
                                const isSystem = role.is_system;

                                return (
                                    <tr
                                        key={role.id}
                                        className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 group"
                                    >
                                        {/* Role Name, Icon & Details */}
                                        <td className="px-6 py-3.5 align-middle min-w-[12.5rem]">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${isSystem
    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" : "bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-300"}`}
                                                >
                                                    {isSystem ? (
                                                        <ShieldCheck className="w-4 h-4" />
                                                    ) : (
                                                        <Shield className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm break-words">
                                                        {role.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="tabular-nums">
                                                            Role #{role.id}
                                                        </span>
                                                        {role.users_count !== undefined && (
                                                            <>
                                                                <span className="text-slate-300 dark:text-slate-400">•</span>
                                                                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                                                    <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
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
                                        <td className="px-6 py-3.5 align-middle">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                                {assignedCount} {assignedCount === 1 ? 'permission' : 'permissions'}
                                            </span>
                                        </td>

                                        {/* Role Type */}
                                        <td className="px-6 py-3.5 align-middle">
                                            {isSystem ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    System Role
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                                                    Custom Role
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-3.5 align-middle whitespace-nowrap min-w-[10rem] text-right">
                                            <div className="inline-flex items-center justify-end gap-2 shrink-0">
                                                {canUpdate && role.is_editable && (
                                                    <Button variant="secondary"
                                                        type="button"
                                                        onClick={() => onEditRole(role)}
                                                        className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        Edit
                                                    </Button>
                                                )}

                                                {canDelete && !isSystem && role.is_deletable && (
                                                    <Button variant="danger"
                                                        type="button"
                                                        onClick={() => onDeleteRole(role)}
                                                        title="Delete role"
                                                        className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        Delete
                                                    </Button>
                                                )}

                                                {(!canUpdate || !role.is_editable) && (!canDelete || !role.is_deletable) && (
                                                    <span className="text-sm text-slate-500 dark:text-slate-400 select-none px-2">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-400" />
                                        <p className="leading-relaxed font-semibold text-slate-700 dark:text-slate-300 text-sm">
                                            No roles match your search criteria.
                                        </p>
                                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400">
                                            Try adjusting your keywords or clearing the filter.
                                        </p>
                                        {searchQuery && (
                                            <Button variant="secondary"
                                                type="button"
                                                onClick={() => onSearchChange('')}
                                                className="mt-2"
                                            >
                                                Clear search query
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer count */}
            <div className="ui-pagination px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{roles.length}</span> configured {roles.length === 1 ? 'role' : 'roles'}
                </span>
            </div>
        </section>
    );
}
