import PageHeader from '@/Components/PageHeader';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    Shield,
    CheckCircle2,
    X,
    Search,
    Info,
    Key,
    Layers,
    ShieldCheck,
    Check,
    Lock,
    Users,
    SlidersHorizontal,
    CheckCheck,
    AlertCircle,
    ChevronRight,
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
    actionType: 'Create' | 'Update' | 'Delete' | 'View';
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
    const [permSearchQuery, setPermSearchQuery] = useState<string>('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title?: string; message: string }>({
        isOpen: false,
        title: 'Role Updated Successfully',
        message: '',
    });
    const [unauthorizedModal, setUnauthorizedModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: '',
    });
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

    const showSuccess = (message: string, title: string = 'Role Updated Successfully') => {
        setSuccessModal({ isOpen: true, title, message });
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

    function getActionType(name: string): 'Create' | 'Update' | 'Delete' | 'View' {
        const cleaned = name.replace(/^route:/, '');
        const parts = cleaned.split('.');
        const actionPart = parts.slice(1).join('.');

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
    }

    function formatPermissionLabel(name: string): string {
        const cleaned = name.replace(/^route:/, '');
        const parts = cleaned.split('.');
        const prefix = parts[0] || '';

        const moduleName = prefix
            .split('-')
            .filter(Boolean)
            .map((part) => part.replace(/_/g, ' '))
            .map(titleCase)
            .join(' ');

        const actionLabel = getActionType(name);

        return `${moduleName} - ${actionLabel}`;
    }

    const permissionsByModule = useMemo(() => {
        return effectivePermissions.reduce((acc, perm) => {
            const mod = perm.module || 'General';
            const displayName = formatPermissionLabel(perm.name);
            const actionType = getActionType(perm.name);

            if (!acc[mod]) acc[mod] = [];

            const existingIndex = acc[mod].findIndex((item) => item.displayName === displayName);

            if (existingIndex === -1) {
                acc[mod].push({
                    id: perm.id,
                    ids: [perm.id],
                    name: perm.name,
                    module: perm.module,
                    displayName,
                    actionType,
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

    // Reset permission search when active module changes or modal toggles
    useEffect(() => {
        setPermSearchQuery('');
    }, [activeModuleTab, isEditModalOpen]);

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

    const isSystemRole = (name: string): boolean => {
        const lower = name.toLowerCase().trim();
        return lower === 'system admin' || lower === 'system administrator';
    };

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
                showSuccess('The new administrative role has been registered successfully.', 'Role Created Successfully');
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
        if (isSystemRole(role.name)) {
            showUnauthorized('Default system roles cannot be deleted to preserve system security.');
            return;
        }

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
                showSuccess('The selected role and its assigned permissions have been updated.', 'Role Updated Successfully');
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
                showSuccess('The administrative role profile has been deleted.', 'Role Deleted Successfully');
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

    const activeModuleAllPerms = permissionsByModule[activeModuleTab] || [];
    const activeModulePermIds = activeModuleAllPerms.flatMap((p) => p.ids);
    const isCurrentModuleAllSelected =
        activeModulePermIds.length > 0 &&
        activeModulePermIds.every((id) => editingRole?.permissions.includes(id));
    const isCurrentModulePartiallySelected =
        !isCurrentModuleAllSelected &&
        activeModulePermIds.some((id) => editingRole?.permissions.includes(id));

    const currentModuleFilteredPerms = useMemo(() => {
        if (!permSearchQuery.trim()) return activeModuleAllPerms;
        const q = permSearchQuery.toLowerCase();
        return activeModuleAllPerms.filter(
            (p) =>
                p.displayName.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.actionType.toLowerCase().includes(q)
        );
    }, [activeModuleAllPerms, permSearchQuery]);

    const renderActionBadge = (actionType: 'Create' | 'Update' | 'Delete' | 'View') => {
        switch (actionType) {
            case 'Create':
                return (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 uppercase tracking-wide">
                        Create
                    </span>
                );
            case 'Update':
                return (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200/80 uppercase tracking-wide">
                        Update
                    </span>
                );
            case 'Delete':
                return (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-800 border border-rose-200/80 uppercase tracking-wide">
                        Delete
                    </span>
                );
            case 'View':
            default:
                return (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                        View
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Role & Permission Management - Access Control" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* 1. Page Header */}
                <PageHeader
                    title="Role & Permission Management"
                    description="Manage institutional user roles, module access, and administrative permissions across the university system."
                    breadcrumbs={[
                        { name: 'Access Control' },
                        { name: 'Role & Permission Management' },
                    ]}
                />

                <div className="p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto pb-16">
                    {/* 2. Institutional Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200/90 rounded-xl shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-900 rounded-lg border border-red-100/80">
                                <Shield className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                        Role & Privilege Directory
                                    </span>
                                    <span className="hidden sm:inline-block text-gray-300">•</span>
                                    <span className="text-[11px] text-gray-500 font-medium hidden sm:inline-block">
                                        University access control and granular capability assignments
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 sm:hidden mt-0.5">
                                    University access control and granular capability assignments
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                RBAC Enforced
                            </span>
                        </div>
                    </div>

                    {/* 3. Summary Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Configured Roles */}
                        <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configured Roles</span>
                                <div className="p-2 bg-red-50 text-red-900 rounded-lg border border-red-100/80">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{stats.totalRoles}</span>
                                <span className="text-[11px] font-medium text-gray-500">active profiles</span>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Institutional access tiers</span>
                            </div>
                        </div>

                        {/* System Permissions */}
                        <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Permissions</span>
                                <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-100/80">
                                    <Key className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{stats.totalPerms}</span>
                                <span className="text-[11px] font-medium text-gray-500">granular privileges</span>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Authorization checkpoints</span>
                            </div>
                        </div>

                        {/* Protected Modules */}
                        <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Protected Modules</span>
                                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-100/80">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{stats.totalModules}</span>
                                <span className="text-[11px] font-medium text-gray-500">subsystems</span>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span>Isolated privilege scopes</span>
                            </div>
                        </div>

                        {/* Access Control Model */}
                        <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs hover:border-gray-300 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Model</span>
                                <div className="p-2 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100/80">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-900 font-sans tracking-tight">RBAC</span>
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                    Strict Enforcement
                                </span>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Role-Based Access Control</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Main Role Management Section */}
                    <div className="bg-white rounded-xl shadow-2xs border border-gray-200/90 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 font-serif flex items-center gap-2">
                                    <span>Configured Roles & Access Rights</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Manage university administrative roles and define system capabilities available to each privilege tier.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={roleSearchQuery}
                                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                                        placeholder="Search roles by title or ID..."
                                        className="w-full pl-8 pr-7 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white placeholder:text-gray-400 transition-all"
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
                                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                                >
                                    <Plus className="w-4 h-4 text-amber-300" />
                                    <span>Create Role</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                        <th className="px-6 py-3.5 w-1/3">
                                            Role Profile
                                        </th>
                                        <th className="px-6 py-3.5 w-1/4">
                                            Permission Coverage
                                        </th>
                                        <th className="px-6 py-3.5 w-1/6">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right w-1/4">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/80 text-xs">
                                    {filteredRoles.length > 0 ? (
                                        filteredRoles.map((role) => {
                                            const count = role.permissions_count ?? role.permissions?.length ?? 0;
                                            const pct = stats.totalPerms > 0 ? Math.round((count / stats.totalPerms) * 100) : 0;
                                            const isSystem = isSystemRole(role.name);

                                            return (
                                                <tr key={role.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-950 text-xs font-bold flex items-center justify-center border border-red-200/70 shadow-2xs shrink-0 font-serif">
                                                                {role.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900 text-sm">{role.name}</span>
                                                                    {isSystem && (
                                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded">
                                                                            System Default
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                                    Role ID #{role.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5 max-w-[200px]">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-semibold text-gray-800 font-mono">
                                                                    {count} <span className="text-gray-500 font-normal font-sans">assigned</span>
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-gray-500 font-mono">
                                                                    {pct}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/60">
                                                                <div
                                                                    className="bg-red-900 h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center justify-end gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditAction(role)}
                                                                className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAction(role)}
                                                                disabled={isSystem}
                                                                className={`border font-semibold text-xs px-2.5 py-1 rounded transition-colors ${
                                                                    isSystem
                                                                        ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-40'
                                                                        : 'border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 cursor-pointer shadow-2xs'
                                                                }`}
                                                            >
                                                                Delete
                                                            </button>
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
                                                    <p className="font-semibold text-gray-700 text-xs">No roles match your search term.</p>
                                                    <p className="text-[11px] text-gray-400">Try adjusting your keywords or clearing the filter.</p>
                                                    {roleSearchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRoleSearchQuery('')}
                                                            className="mt-2 px-3 py-1.5 text-xs font-semibold text-red-950 hover:bg-red-50 hover:border-red-900/50 border border-red-900/30 rounded-md transition-colors cursor-pointer shadow-2xs"
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

                        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-semibold text-gray-800">{filteredRoles.length}</span> of <span className="font-semibold text-gray-800">{roles.length}</span> configured roles
                            </span>
                        </div>
                    </div>

                    {/* 5. Security Advisory Notice */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3.5 text-xs text-amber-950 shadow-2xs">
                        <div className="p-1.5 bg-amber-100/70 text-amber-800 rounded-lg border border-amber-200 shrink-0 mt-0.5">
                            <Info className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-xs">Security Advisory & Session Propagation</h4>
                            <p className="text-amber-900/90 text-xs mt-0.5 leading-relaxed">
                                Changes to role permissions take effect upon the user's next authentication session. Users currently signed in will receive updated access rights immediately upon refreshing their active token or re-logging into the system.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Create Role Modal */}
                <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl">
                        <div className="h-1.5 w-full bg-red-900 shrink-0"></div>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-900 rounded-lg border border-red-100/80">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-serif">Create Administrative Role</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Register a new access role for institutional university users.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
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
                                        className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all placeholder:text-gray-400"
                                        placeholder="e.g. Property Custodian or Department Auditor"
                                        required
                                        autoFocus
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        Use a clear descriptive name identifying the role's organizational responsibility.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end px-6 py-3.5 bg-gray-50/80 border-t border-gray-200 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingRole}
                                    className="px-5 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                                >
                                    {isCreatingRole ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Edit Role & Permissions Modal - Two-Column Administrative Layout */}
                <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="4xl">
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
                        <div className="h-1.5 w-full bg-red-900 shrink-0"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-900 rounded-lg border border-red-100/80">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-serif">Edit Role & Permissions</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Configure role title and module access privileges for{' '}
                                        <strong className="text-gray-800 font-semibold">{editingRole?.name}</strong>.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto grow flex flex-col space-y-5">
                            <form id="edit-role-form" onSubmit={handleUpdateRole} className="space-y-5">
                                {/* Role Name Field */}
                                <div className="bg-gray-50/60 border border-gray-200/90 rounded-xl p-4">
                                    <label htmlFor="editRoleName" className="block mb-1.5 text-xs font-semibold text-gray-700">
                                        Role Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editRoleName"
                                        value={editingRole?.name || ''}
                                        onChange={(e) => setEditingRole(editingRole ? { ...editingRole, name: e.target.value } : null)}
                                        className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all max-w-md"
                                        required
                                    />
                                </div>

                                {/* Permission Summary Line */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 font-serif flex items-center gap-2">
                                            <span>Module Permission Matrix</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Select granular operational actions permitted for this role across system modules.
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium self-start sm:self-auto bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                                        <span className="font-bold text-gray-900 font-mono">{editingRole?.permissions.length ?? 0}</span> of{' '}
                                        <span className="font-bold text-gray-900 font-mono">{stats.totalPerms}</span> total assigned
                                    </div>
                                </div>

                                {/* Mobile Module Selector (< md) */}
                                <div className="md:hidden">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">System Module</label>
                                    <select
                                        value={activeModuleTab}
                                        onChange={(e) => setActiveModuleTab(e.target.value)}
                                        className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
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

                                {/* Two-Column Layout (Desktop & Tablet: md:flex) */}
                                <div className="border border-gray-200/90 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[400px] shadow-2xs">
                                    {/* LEFT PANEL: System Modules */}
                                    <div className="hidden md:block w-64 bg-gray-50/80 border-r border-gray-200 shrink-0 overflow-y-auto max-h-[460px]">
                                        <div className="px-4 py-3 border-b border-gray-200/80 bg-gray-100/60 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                                System Modules
                                            </span>
                                            <span className="text-[11px] font-mono text-gray-400">
                                                {moduleNames.length}
                                            </span>
                                        </div>
                                        <nav className="p-2 space-y-1">
                                            {moduleNames.map((mod) => {
                                                const isSelected = mod === activeModuleTab;
                                                const modStats = getModuleStats(mod);
                                                const isAllAssigned = modStats.total > 0 && modStats.assigned === modStats.total;
                                                const isPartial = modStats.assigned > 0 && !isAllAssigned;

                                                return (
                                                    <button
                                                        key={mod}
                                                        type="button"
                                                        onClick={() => setActiveModuleTab(mod)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-white text-red-950 font-bold border border-red-200 shadow-2xs ring-1 ring-red-900/10'
                                                                : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 font-medium'
                                                        }`}
                                                    >
                                                        <span className="truncate">{mod}</span>
                                                        <span className={`text-[11px] font-mono ml-2 shrink-0 px-1.5 py-0.5 rounded ${
                                                            isAllAssigned
                                                                ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80'
                                                                : isPartial
                                                                ? 'bg-red-50 text-red-900 font-semibold border border-red-200/80'
                                                                : 'bg-gray-100 text-gray-500 font-normal'
                                                        }`}>
                                                            {modStats.assigned}/{modStats.total}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* RIGHT PANEL: Selected Module Permissions */}
                                    <div className="flex-1 p-5 overflow-y-auto max-h-[460px] flex flex-col justify-between bg-white">
                                        <div className="space-y-4">
                                            {/* Selected Module Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-sm font-bold text-gray-900 font-serif">{activeModuleTab}</h5>
                                                        <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {activeModuleAllPerms.length} privileges
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Authorize access privileges within the {activeModuleTab} module.
                                                    </p>
                                                </div>

                                                <label className="inline-flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
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
                                                        Select All in Module
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Sub-filter inside Module */}
                                            {activeModuleAllPerms.length > 5 && (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={permSearchQuery}
                                                        onChange={(e) => setPermSearchQuery(e.target.value)}
                                                        placeholder={`Filter ${activeModuleTab} permissions...`}
                                                        className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-gray-50/50 placeholder:text-gray-400"
                                                    />
                                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                                    {permSearchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPermSearchQuery('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Permission Items List */}
                                            {currentModuleFilteredPerms.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {currentModuleFilteredPerms.map((perm) => {
                                                        const isChecked = perm.ids.some((id) => editingRole?.permissions.includes(id));
                                                        return (
                                                            <label
                                                                key={perm.id}
                                                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                                                    isChecked
                                                                        ? 'bg-red-50/20 border-red-200 shadow-2xs'
                                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handlePermissionToggle(perm)}
                                                                        className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900 focus:ring-1 cursor-pointer shrink-0"
                                                                    />
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className={`text-xs truncate ${isChecked ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'}`}>
                                                                            {perm.displayName}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400 font-mono truncate">
                                                                            {perm.name}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 ml-3">
                                                                    {renderActionBadge(perm.actionType)}
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-gray-500 text-xs">
                                                    {permSearchQuery ? (
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <Search className="w-5 h-5 text-gray-300" />
                                                            <span>No permissions match "{permSearchQuery}"</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPermSearchQuery('')}
                                                                className="text-xs text-red-900 font-semibold hover:underline mt-1"
                                                            >
                                                                Clear filter
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        'No permissions configured under this module.'
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 shrink-0 gap-2.5 bg-gray-50/80 sticky bottom-0">
                            <div className="text-xs text-gray-500 font-medium">
                                <span className="font-bold text-gray-900 font-mono">{editingRole?.permissions.length ?? 0}</span> permissions active
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="edit-role-form"
                                    className="px-5 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Delete Role Modal */}
                <Modal show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl">
                        <div className="h-1.5 w-full bg-red-700 shrink-0"></div>
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-red-50 rounded-xl text-red-700 shrink-0 border border-red-100">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-serif mb-1">
                                        Delete Administrative Role
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Are you sure you want to delete the role <strong className="text-gray-900 font-semibold">"{roleToDelete?.name}"</strong>?
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1.5">
                                        Any staff members assigned to this role will lose their granted privileges. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteRole}
                                    className="px-5 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase font-mono tracking-wider cursor-pointer"
                                >
                                    Delete Role
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Success Modal */}
                <Modal show={successModal.isOpen} onClose={() => setSuccessModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl text-center">
                        <div className="h-1.5 w-full bg-emerald-600 shrink-0"></div>
                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100 shadow-2xs">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">
                                {successModal.title || 'Role Updated Successfully'}
                            </h3>
                            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                                {successModal.message || 'The selected role and its assigned permissions have been updated.'}
                            </p>
                            <button
                                type="button"
                                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                                className="w-full px-5 py-2.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer uppercase font-mono tracking-wider"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Unauthorized Modal */}
                <Modal show={unauthorizedModal.isOpen} onClose={() => setUnauthorizedModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl text-center">
                        <div className="h-1.5 w-full bg-red-800 shrink-0"></div>
                        <div className="p-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-red-50 text-red-800 mb-3 border border-red-100 shadow-2xs">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">Permission Required</h3>
                            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                                {unauthorizedModal.message || 'You do not have permission to perform this action.'}
                            </p>
                            <button
                                type="button"
                                onClick={() => setUnauthorizedModal({ isOpen: false, message: '' })}
                                className="w-full px-5 py-2.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer uppercase font-mono tracking-wider"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}