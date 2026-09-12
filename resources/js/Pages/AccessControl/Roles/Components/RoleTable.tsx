import React from 'react';
import { Plus, Search, Shield, ShieldCheck, Lock, Users } from 'lucide-react';
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
            <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                <div className="min-w-0">
                    <h2
                        id="roles-heading"
                        className="text-base font-bold text-gray-900 truncate"
                    >
                        Configured Roles
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Manage institutional roles and configure granular capability assignments across modules.
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
                            className="w-full pl-8 pr-7 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
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
                                Permissions Coverage
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
                                const percentage =
                                    totalPermissionsCount > 0
                                        ? Math.round((assignedCount / totalPermissionsCount) * 100)
                                        : 0;

                                return (
                                    <tr
                                        key={role.id}
                                        className="hover:bg-gray-50/70 transition-colors"
                                    >
                                        {/* Role Name, Icon & Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        isSystem
                                                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                                                            : 'bg-red-50 border-red-100 text-red-900'
                                                    }`}
                                                >
                                                    {isSystem ? (
                                                        <ShieldCheck className="w-4 h-4" />
                                                    ) : (
                                                        <Shield className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 text-sm truncate">
                                                        {role.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                                                        <span className="font-mono">
                                                            Role #{role.id}
                                                        </span>
                                                        {role.users_count !== undefined && (
                                                            <>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                                                                    <Users className="w-3 h-3 text-gray-400" />
                                                                    {role.users_count}{' '}
                                                                    {role.users_count === 1 ? 'user' : 'users'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Permissions Count & Progress Bar */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 max-w-[220px]">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-gray-800 tabular-nums">
                                                        {assignedCount}{' '}
                                                        <span className="text-gray-400 font-normal">
                                                            / {totalPermissionsCount}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                                                            percentage === 100
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : percentage >= 50
                                                                ? 'bg-red-50 text-red-900 border-red-200/70'
                                                                : percentage > 0
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                        }`}
                                                    >
                                                        {percentage === 100 ? '100% Full' : `${percentage}%`}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${
                                                            percentage === 100
                                                                ? 'bg-emerald-600'
                                                                : percentage >= 50
                                                                ? 'bg-red-900'
                                                                : percentage > 0
                                                                ? 'bg-amber-600'
                                                                : 'bg-transparent'
                                                        }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Type */}
                                        <td className="px-6 py-4">
                                            {isSystem ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                    <Lock className="w-3 h-3 text-slate-500" />
                                                    System Role
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    Custom Role
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex items-center justify-end gap-2.5">
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditRole(role)}
                                                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200"
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
                                                        className={`border font-semibold text-xs px-2.5 py-1 rounded transition-colors shadow-2xs ${
                                                            isSystem || !role.is_deletable
                                                                ? 'border-gray-200 text-gray-300 bg-gray-50/50 cursor-not-allowed shadow-none'
                                                                : 'border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 cursor-pointer'
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

