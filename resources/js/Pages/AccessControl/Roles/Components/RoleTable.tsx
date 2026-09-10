import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Role } from '../types';

interface RoleTableProps {
    roles: Role[];
    totalPermissionsCount: number;
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
    totalPermissionsCount,
    searchQuery,
    onSearchChange,
    canCreate,
    canUpdate,
    canDelete,
    onCreateRole,
    onEditRole,
    onDeleteRole,
}: RoleTableProps) {
    return (
        <section
            aria-labelledby="roles-heading"
            className="bg-white rounded-xl shadow-2xs border border-gray-200/90 overflow-hidden flex flex-col"
        >
            {/* Header with Search and Create Action */}
            <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                <div>
                    <h2
                        id="roles-heading"
                        className="text-base font-bold text-gray-900"
                    >
                        Configured Roles
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Manage institutional roles and configure granular capability assignments across modules.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search roles..."
                            aria-label="Search roles"
                            className="w-full pl-8 pr-7 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white placeholder:text-gray-400 transition-all"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
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
                            className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-semibold py-2 px-4 rounded-lg shadow-2xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-amber-300" />
                            <span>Create Role</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 min-w-full">
                <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                            <th scope="col" className="px-6 py-3.5 w-2/5">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-1/4">
                                Permissions
                            </th>
                            <th scope="col" className="px-6 py-3.5 w-1/6">
                                Type
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-right w-1/5">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/80 text-xs">
                        {roles.length > 0 ? (
                            roles.map((role) => {
                                const assignedCount =
                                    role.permissions_count ?? role.permissions?.length ?? 0;
                                const isSystem = role.is_system;

                                return (
                                    <tr
                                        key={role.id}
                                        className="hover:bg-gray-50/70 transition-colors"
                                    >
                                        {/* Role Name & ID */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 text-sm">
                                                    {role.name}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                    Role #{role.id}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Permissions Count */}
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-800">
                                                {assignedCount} of {totalPermissionsCount} permissions
                                            </span>
                                        </td>

                                        {/* Role Type */}
                                        <td className="px-6 py-4">
                                            {isSystem ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                    System Role
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                    Custom Role
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex items-center justify-end gap-3">
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditRole(role)}
                                                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-2 rounded hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteRole(role)}
                                                        disabled={isSystem || !role.is_deletable}
                                                        title={
                                                            isSystem
                                                                ? 'System roles are protected and cannot be deleted'
                                                                : !role.is_deletable
                                                                ? `Cannot delete while ${role.users_count ?? 0} user(s) are assigned`
                                                                : 'Delete role'
                                                        }
                                                        className={`font-semibold text-xs px-2.5 py-1 rounded transition-colors ${
                                                            isSystem || !role.is_deletable
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'text-red-900 hover:text-red-950 hover:bg-red-50 cursor-pointer'
                                                        }`}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-gray-300" />
                                        <p className="font-semibold text-gray-700 text-xs">
                                            No roles match your search criteria.
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            Try adjusting your keywords or clearing the filter.
                                        </p>
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => onSearchChange('')}
                                                className="mt-2 px-3 py-1.5 text-xs font-semibold text-red-950 hover:bg-red-50 border border-red-900/30 rounded-md transition-colors cursor-pointer"
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
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                    Showing <span className="font-semibold text-gray-800">{roles.length}</span> configured {roles.length === 1 ? 'role' : 'roles'}
                </span>
            </div>
        </section>
    );
}
