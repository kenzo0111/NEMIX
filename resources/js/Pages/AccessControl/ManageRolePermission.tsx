import PageHeader from '@/Components/PageHeader';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Edit2,
    Trash2,
    Shield,
    Check,
    X,
    Search,
    Info,
} from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';
import { getSidebarModules } from '@/utils/sidebarConfig';
import React, { useState, useEffect, useMemo } from 'react';

interface Permission {
    id: number;
    name: string;
    module?: string;
}

interface PermissionItem {
    id: number;
    ids: number[];
    name: string;
    module?: string;
    displayName: string;
}

interface Role {
    id: number;
    name: string;
    permissions: number[];
    permissions_count?: number;
}

interface Props {
    auth: any;
    roles?: Role[];
    permissions?: Permission[];
}

export default function ManageRolePermission({ auth, roles: initialRoles = [], permissions: systemPermissions = [] }: Props) {
    const user = auth?.user;
    const { flash } = usePage().props as any;

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreatingRole, setIsCreatingRole] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [activeModuleTab, setActiveModuleTab] = useState<string>('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [unauthorizedModal, setUnauthorizedModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [roleSearchQuery, setRoleSearchQuery] = useState('');

    const modules = getSidebarModules('Access', 'Manage Role Permission');

    const isPermission = (item: unknown): item is Permission => {
        return (
            item !== null &&
            typeof item === 'object' &&
            'id' in item &&
            'name' in item &&
            typeof (item as Record<string, unknown>).id === 'number' &&
            typeof (item as Record<string, unknown>).name === 'string'
        );
    };

    const normalizePermissions = (value: unknown): Permission[] => {
        if (Array.isArray(value)) {
            return value.filter(isPermission);
        }

        if (value && typeof value === 'object') {
            return Object.values(value as Record<string, unknown>).filter(isPermission);
        }

        return [];
    };

    const [roles, setRoles] = useState<Role[]>(Array.isArray(initialRoles) ? initialRoles : []);
    const [permissions, setPermissions] = useState<Permission[]>(normalizePermissions(systemPermissions));

    const userPermissions = auth?.permissions || [];
    const isSystemAdmin = auth?.is_system_admin ?? false;
    const canCreateRole = isSystemAdmin || userPermissions.includes('route:access-control.role-permission.store');
    const canUpdateRole = isSystemAdmin || userPermissions.includes('route:access-control.role-permission.update');
    const canDeleteRole = isSystemAdmin || userPermissions.includes('route:access-control.role-permission.destroy');

    const effectivePermissions = normalizePermissions(permissions);

    useEffect(() => {
        if (Array.isArray(initialRoles)) {
            setRoles(initialRoles);
        }
    }, [initialRoles]);

    useEffect(() => {
        setPermissions(normalizePermissions(systemPermissions));
    }, [systemPermissions]);

    const showSuccess = (message: string) => {
        setSuccessModal({ isOpen: true, message });
    };

    const showUnauthorized = (message: string) => {
        setUnauthorizedModal({ isOpen: true, message });
    };

    useEffect(() => {
        if (flash?.success) {
            showSuccess(flash.success);
        }
    }, [flash]);

    function titleCase(text: string): string {
        return text
            .toLowerCase()
            .split(' ')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    function formatPermissionLabel(name: string): string {
        const cleaned = name.replace(/^route:/, '');
        const parts = cleaned.split('.');
        const prefix = parts[0] || '';
        const actionPart = parts.slice(1).join('.');

        const moduleName = prefix
            .split('-')
            .filter(Boolean)
            .map((part) => part.replace(/_/g, ' '))
            .map(titleCase)
            .join(' ');

        const actionLabel = (() => {
            if (/\b(store|create)\b$/i.test(actionPart)) {
                return 'Create';
            }

            if (/\b(update|edit)\b$/i.test(actionPart)) {
                return 'Update';
            }

            if (/\b(destroy|delete)\b$/i.test(actionPart)) {
                return 'Delete';
            }

            return 'View';
        })();

        return `${moduleName} - ${actionLabel}`;
    }

    const permissionsByModule = useMemo(() => {
        return effectivePermissions.reduce((acc, perm) => {
            const mod = perm.module || 'General';
            const displayName = formatPermissionLabel(perm.name);

            if (!acc[mod]) acc[mod] = [];

            const existingIndex = acc[mod].findIndex((item) => item.displayName === displayName);

            if (existingIndex === -1) {
                acc[mod].push({
                    id: perm.id,
                    ids: [perm.id],
                    name: perm.name,
                    module: perm.module,
                    displayName,
                });
            } else {
                acc[mod][existingIndex].ids.push(perm.id);
            }

            return acc;
        }, {} as Record<string, PermissionItem[]>);
    }, [effectivePermissions]);

    const moduleNames = useMemo(() => Object.keys(permissionsByModule), [permissionsByModule]);

    // Ensure activeModuleTab points to a valid module
    useEffect(() => {
        if (moduleNames.length > 0 && (!activeModuleTab || !permissionsByModule[activeModuleTab])) {
            setActiveModuleTab(moduleNames[0]);
        }
    }, [moduleNames, activeModuleTab, permissionsByModule]);

    const filteredRoles = useMemo(() => {
        if (!roleSearchQuery.trim()) return roles;
        const q = roleSearchQuery.toLowerCase();
        return roles.filter((role) =>
            role.name.toLowerCase().includes(q) ||
            String(role.id).includes(q)
        );
    }, [roles, roleSearchQuery]);

    const stats = useMemo(() => {
        const totalRoles = roles.length;
        const totalPerms = effectivePermissions.length;
        const totalModules = Object.keys(permissionsByModule).length;
        return { totalRoles, totalPerms, totalModules };
    }, [roles, effectivePermissions, permissionsByModule]);

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        router.post(route('access-control.role-permission.store'), {
            name: newRoleName,
        }, {
            preserveScroll: true,
            onStart: () => setIsCreatingRole(true),
            onFinish: () => setIsCreatingRole(false),
            onSuccess: () => {
                setNewRoleName('');
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleEditClick = (role: Role) => {
        setEditingRole({ ...role });
        if (moduleNames.length > 0 && (!activeModuleTab || !permissionsByModule[activeModuleTab])) {
            setActiveModuleTab(moduleNames[0]);
        }
        setIsEditModalOpen(true);
    };

    const handleCreateClick = () => {
        if (canCreateRole) {
            setIsCreateModalOpen(true);
            return;
        }

        showUnauthorized('You do not have permission to create roles.');
    };

    const handleEditAction = (role: Role) => {
        if (canUpdateRole) {
            handleEditClick(role);
            return;
        }

        showUnauthorized('You do not have permission to edit roles.');
    };

    const handleDeleteAction = (role: Role) => {
        if (canDeleteRole) {
            handleDeleteClick(role);
            return;
        }

        showUnauthorized('You do not have permission to delete roles.');
    };

    const handlePermissionToggle = (permission: PermissionItem) => {
        if (!editingRole) return;

        const hasPermission = permission.ids.some((id) => editingRole.permissions.includes(id));
        let updatedPermissions = [...editingRole.permissions];

        if (hasPermission) {
            updatedPermissions = updatedPermissions.filter((id) => !permission.ids.includes(id));
        } else {
            permission.ids.forEach((id) => {
                if (!updatedPermissions.includes(id)) {
                    updatedPermissions.push(id);
                }
            });
        }

        setEditingRole({ ...editingRole, permissions: updatedPermissions });
    };

    const handleSelectAllModule = (moduleName: string, selectAll: boolean) => {
        if (!editingRole || !permissionsByModule[moduleName]) return;

        const modulePermIds = permissionsByModule[moduleName].flatMap((p) => p.ids);
        let updatedPermissions = [...editingRole.permissions];

        if (selectAll) {
            modulePermIds.forEach((id) => {
                if (!updatedPermissions.includes(id)) {
                    updatedPermissions.push(id);
                }
            });
        } else {
            updatedPermissions = updatedPermissions.filter((id) => !modulePermIds.includes(id));
        }

        setEditingRole({ ...editingRole, permissions: updatedPermissions });
    };

    const handleUpdateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole || !editingRole.name.trim()) return;

        router.put(route('access-control.role-permission.update', editingRole.id), {
            name: editingRole.name,
            permissions: editingRole.permissions,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingRole(null);
            },
        });
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRole = () => {
        if (!roleToDelete) return;

        router.delete(route('access-control.role-permission.destroy', roleToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setRoleToDelete(null);
            },
        });
    };

    const getModuleStats = (moduleName: string) => {
        const perms = permissionsByModule[moduleName] || [];
        const total = perms.length;
        if (!editingRole) return { assigned: 0, total };
        const assigned = perms.filter((p) => p.ids.some((id) => editingRole.permissions.includes(id))).length;
        return { assigned, total };
    };

    const currentModulePerms = permissionsByModule[activeModuleTab] || [];
    const currentModulePermIds = currentModulePerms.flatMap((p) => p.ids);
    const isCurrentModuleAllSelected =
        currentModulePermIds.length > 0 &&
        currentModulePermIds.every((id) => editingRole?.permissions.includes(id));
    const isCurrentModulePartiallySelected =
        !isCurrentModuleAllSelected &&
        currentModulePermIds.some((id) => editingRole?.permissions.includes(id));

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Access Control - Manage Role & Permission" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <PageHeader
                    title="Role & Permission Management"
                    description="Define access levels, system security privileges, and module capability rules"
                    breadcrumbs={[{ name: 'Access Control' }, { name: 'Manage Role Permission' }]}
                />

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* 1. Compact Institutional Access Control Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 shadow-2xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-gray-900 font-serif tracking-wide text-sm">
                                    Access Control Summary
                                </h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Roles:</span>
                                    <span className="font-semibold text-gray-900 font-mono">{stats.totalRoles}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Permissions:</span>
                                    <span className="font-semibold text-gray-900 font-mono">{stats.totalPerms}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Protected Modules:</span>
                                    <span className="font-semibold text-gray-900 font-mono">{stats.totalModules}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Access Model:</span>
                                    <span className="font-medium text-gray-800">Role-Based Access Control</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Role Management Card / Ledger */}
                    <div className="bg-white rounded-lg shadow-2xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 font-serif">
                                    Configured User Roles & Access Rights
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Administrators can define system roles and configure assigned access privileges across institutional modules.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={roleSearchQuery}
                                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                                        placeholder="Search role by name or ID..."
                                        className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                                    />
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    {roleSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setRoleSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                            aria-label="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-900 hover:bg-red-800 border border-red-950 rounded font-semibold text-xs text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create Role</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/80">
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-600 uppercase w-1/3">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-600 uppercase w-1/4">
                                            Permissions
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-600 uppercase w-1/6">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-600 uppercase text-right w-1/4">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {filteredRoles.length > 0 ? (
                                        filteredRoles.map((role) => (
                                            <tr key={role.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 text-sm">{role.name}</span>
                                                        <span className="text-[11px] text-gray-500 font-mono mt-0.5">
                                                            ROLE ID: #{role.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className="text-xs text-gray-700">
                                                        {role.permissions_count ?? role.permissions?.length ?? 0} permissions
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                        <span>Active</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditAction(role)}
                                                            className="px-2.5 py-1.5 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-red-900 border border-gray-300 hover:border-red-900/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAction(role)}
                                                            className="px-2.5 py-1.5 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="w-8 h-8 text-gray-300" />
                                                    <p className="font-medium text-gray-600 text-xs">No roles match your search term.</p>
                                                    {roleSearchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRoleSearchQuery('')}
                                                            className="text-xs font-semibold text-red-900 hover:underline cursor-pointer"
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

                        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-semibold text-gray-700">{filteredRoles.length}</span> of <span className="font-semibold text-gray-700">{roles.length}</span> configured roles
                            </span>
                        </div>
                    </div>

                    {/* 3. Security Advisory Notice */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-950">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-amber-900">Security Advisory: </span>
                            <span>
                                Changes to role permissions take effect after user re-authentication. Users currently signed in will receive updated access permissions on their next session.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Create Role Modal */}
                <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow-xl">
                        <div className="h-1 w-full bg-red-900 shrink-0"></div>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-serif">Create Role</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Define a new user role in the access control registry.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="roleName" className="block mb-1.5 text-xs font-semibold text-gray-700">
                                        Role Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="roleName"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        className="bg-white border border-gray-300 text-gray-900 text-xs rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all"
                                        placeholder="e.g. Property Custodian"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-200 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingRole}
                                    className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded font-semibold text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    {isCreatingRole ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Edit Role & Permissions Modal - Two-Panel Layout */}
                <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="4xl">
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
                        <div className="h-1 w-full bg-red-900 shrink-0"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-serif">Edit Role & Permissions</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Configure role identity and module access privileges.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto grow flex flex-col space-y-5">
                            <form id="edit-role-form" onSubmit={handleUpdateRole} className="space-y-5">
                                {/* Role Name Field */}
                                <div>
                                    <label htmlFor="editRoleName" className="block mb-1.5 text-xs font-semibold text-gray-700">
                                        Role Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editRoleName"
                                        value={editingRole?.name || ''}
                                        onChange={(e) => setEditingRole(editingRole ? { ...editingRole, name: e.target.value } : null)}
                                        className="bg-white border border-gray-300 text-gray-900 text-xs rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all max-w-md"
                                        required
                                    />
                                </div>

                                {/* Sub-header with Counter */}
                                <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 font-serif">Assign Permissions</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Select the permissions this role may access within each system module.</p>
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded border border-gray-200 self-start sm:self-auto">
                                        <span className="font-semibold text-gray-900">{editingRole?.permissions.length ?? 0}</span> of <span className="font-semibold text-gray-900">{stats.totalPerms}</span> permissions assigned
                                    </div>
                                </div>

                                {/* Mobile Module Selector (< md) */}
                                <div className="md:hidden">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">System Module</label>
                                    <select
                                        value={activeModuleTab}
                                        onChange={(e) => setActiveModuleTab(e.target.value)}
                                        className="w-full text-xs font-medium border border-gray-300 rounded p-2 focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                                    >
                                        {moduleNames.map((mod) => {
                                            const modStats = getModuleStats(mod);
                                            return (
                                                <option key={mod} value={mod}>
                                                    {mod} ({modStats.assigned}/{modStats.total})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Two-Panel Layout (Desktop & Tablet: md:flex) */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[380px]">
                                    {/* LEFT PANEL: System Modules (hidden on mobile, visible md:block) */}
                                    <div className="hidden md:block w-64 bg-gray-50/70 border-r border-gray-200 shrink-0 overflow-y-auto max-h-[440px]">
                                        <div className="px-4 py-3 border-b border-gray-200/80 bg-gray-100/60">
                                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                                System Modules
                                            </span>
                                        </div>
                                        <nav className="p-2 space-y-1">
                                            {moduleNames.map((mod) => {
                                                const isSelected = mod === activeModuleTab;
                                                const modStats = getModuleStats(mod);
                                                return (
                                                    <button
                                                        key={mod}
                                                        type="button"
                                                        onClick={() => setActiveModuleTab(mod)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded transition-colors text-left cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-red-900 text-white font-semibold shadow-2xs'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <span className="truncate">{mod}</span>
                                                        <span className={`text-[11px] font-mono ml-2 shrink-0 ${
                                                            isSelected ? 'text-red-100' : 'text-gray-500'
                                                        }`}>
                                                            {modStats.assigned}/{modStats.total}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* RIGHT PANEL: Selected Module Permissions */}
                                    <div className="flex-1 p-5 overflow-y-auto max-h-[440px] flex flex-col justify-between bg-white">
                                        <div className="space-y-4">
                                            {/* Selected Module Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                                                <div>
                                                    <h5 className="text-sm font-bold text-gray-900 font-serif">{activeModuleTab}</h5>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Configure which {activeModuleTab} functions this role may access.
                                                    </p>
                                                </div>
                                                <label className="inline-flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={isCurrentModuleAllSelected}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = isCurrentModulePartiallySelected;
                                                        }}
                                                        onChange={(e) => handleSelectAllModule(activeModuleTab, e.target.checked)}
                                                        className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900 focus:ring-1 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        Select all permissions in this module
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Permission Rows */}
                                            {currentModulePerms.length > 0 ? (
                                                <div className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white overflow-hidden">
                                                    {currentModulePerms.map((perm) => {
                                                        const isChecked = perm.ids.some((id) => editingRole?.permissions.includes(id));
                                                        return (
                                                            <label
                                                                key={perm.id}
                                                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                                                    isChecked ? 'bg-red-50/20' : 'hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handlePermissionToggle(perm)}
                                                                    className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900 focus:ring-1 cursor-pointer"
                                                                />
                                                                <span className={`text-xs ${isChecked ? 'text-gray-900 font-semibold' : 'text-gray-700 font-normal'}`}>
                                                                    {perm.displayName}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-gray-500 text-xs">
                                                    No permissions configured under this module.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-200 shrink-0 gap-2.5 bg-gray-50/80">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-role-form"
                                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                                Update Role & Permissions
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow-xl">
                        <div className="h-1 w-full bg-red-700 shrink-0"></div>
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-red-50 rounded-full text-red-700 shrink-0 border border-red-100">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-serif mb-1">
                                        Delete Role
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Are you sure you want to delete the role <strong className="text-gray-900 font-semibold">"{roleToDelete?.name}"</strong>?
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        This action will permanently revoke this role profile from any assigned administrative accounts.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2.5 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteRole}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded transition-colors cursor-pointer"
                                >
                                    Delete Role
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Success Notification Modal */}
                <Modal show={successModal.isOpen} onClose={() => setSuccessModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow-xl text-center">
                        <div className="h-1 w-full bg-emerald-600 shrink-0"></div>
                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">Action Completed</h3>
                            <p className="text-xs text-gray-600 mb-5 leading-relaxed">{successModal.message}</p>
                            <button
                                type="button"
                                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                                className="w-full px-4 py-2 rounded text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Unauthorized Action Modal */}
                <Modal show={unauthorizedModal.isOpen} onClose={() => setUnauthorizedModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-lg bg-white border border-gray-200 shadow-xl text-center">
                        <div className="h-1 w-full bg-red-800 shrink-0"></div>
                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-800 mb-3 border border-red-100">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">Permission Required</h3>
                            <p className="text-xs text-gray-600 mb-5 leading-relaxed">{unauthorizedModal.message}</p>
                            <button
                                type="button"
                                onClick={() => setUnauthorizedModal({ isOpen: false, message: '' })}
                                className="w-full px-4 py-2 rounded text-xs font-semibold text-white bg-red-900 hover:bg-red-800 transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}