import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Shield, Check, X, Search, Key, Users, ShieldCheck, Info } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useState, useEffect, useMemo } from 'react';

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
    const [collapsed, setCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
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

    const permissionsByModule = effectivePermissions.reduce((acc, perm) => {
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
        if (!editingRole) return;

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

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Access Control - Manage Role & Permission" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>

                {/* Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">University Enterprise Administrative System</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <span>SYSTEM MODE: LIVE PRODUCTION</span>
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Access Control' }, { name: 'Manage Role Permission' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Manage Roles & Permissions</h2>
                            <p className="text-xs text-gray-500 font-medium">Define access levels, system security privileges, and module capability rules</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">

                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-red-50 border border-gray-200">
                                    <Users className="w-4 h-4 text-red-900" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-red-50 text-red-800 border border-red-200">
                                    CONFIGURED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.totalRoles}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Configured Roles</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Active Access Profiles</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                    <Key className="w-4 h-4 text-emerald-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    SYSTEM-WIDE
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.totalPerms}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">System Permissions</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Granular Privilege Definitions</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <ShieldCheck className="w-4 h-4 text-blue-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-50 text-blue-800 border border-blue-200">
                                    COVERAGE
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.totalModules}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">System Modules</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Protected Functional Areas</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                                    <Shield className="w-4 h-4 text-amber-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-amber-50 text-amber-800 border border-amber-200">
                                    AUDITED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">RBAC Mode</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Access Model</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Role-Based Access Control</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card / Role Ledger */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">Configured User Roles & Access Rights</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-red-100 text-red-900 rounded-full border border-red-200">
                                        {filteredRoles.length} {filteredRoles.length === 1 ? 'Role' : 'Roles'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Manage user role definitions and granted administrative permission capabilities</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={roleSearchQuery}
                                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                                        placeholder="Search role by name..."
                                        className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold border border-gray-300 rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    {roleSearchQuery && (
                                        <button
                                            onClick={() => setRoleSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={handleCreateClick}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-900 hover:bg-red-800 border border-red-950 rounded font-bold text-xs text-white uppercase tracking-wider shadow-xs transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create New Role</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-300 bg-gray-200/60 font-serif">
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/3">Role Profile</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/4">Permissions Assigned</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase text-right w-1/4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {filteredRoles.length > 0 ? (
                                        filteredRoles.map((role) => (
                                            <tr key={role.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-red-900/10 text-red-950 font-bold flex items-center justify-center text-sm shrink-0 border border-red-900/20 shadow-2xs">
                                                            {role.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 text-sm group-hover:text-red-900 transition-colors">{role.name}</span>
                                                            <span className="text-[11px] text-gray-500 font-mono tracking-wider">ROLE ID: #{role.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-emerald-50 text-emerald-800 border-emerald-200/80 font-mono">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                        {role.permissions_count ?? role.permissions?.length ?? 0} Permissions Granted
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-blue-50 text-blue-800 border-blue-200/80">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                        Active Role
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditAction(role)}
                                                            className="px-3 py-1.5 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors inline-flex items-center gap-1.5"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAction(role)}
                                                            className="px-3 py-1.5 text-xs font-bold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1.5"
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
                                                    <p className="font-medium text-gray-600">No roles match your search term.</p>
                                                    {roleSearchQuery && (
                                                        <button
                                                            onClick={() => setRoleSearchQuery('')}
                                                            className="text-xs font-bold text-red-900 hover:underline"
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

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-700">{filteredRoles.length}</span> of <span className="font-bold text-gray-700">{roles.length}</span> configured roles
                            </span>
                        </div>
                    </div>

                    {/* Help Note / Security Advisory */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                            <Info className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-amber-900">
                            <strong className="font-bold uppercase tracking-wider block text-[11px] mb-0.5">Security System Advisory:</strong>
                            Modifications to role permissions take effect automatically upon user re-authentication. Users currently logged in will receive updated access policies on their next session.
                        </div>
                    </div>

                </div>

                {/* Create Role Modal */}
                <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white">
                        {/* Top Decorative Accent Gradient */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950 shrink-0"></div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-900 flex items-center justify-center shadow-xs">
                                    <Shield className="w-5 h-5 text-red-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">Create New Role</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Define a user role to configure module access permissions.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-red-900 hover:bg-red-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleCreateRole}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="roleName" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Role Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            id="roleName"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-900/20 focus:border-red-900 block w-full pl-9 p-2.5 font-sans transition-all"
                                            placeholder="e.g. Audit Manager"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end px-6 py-4 bg-gray-50/80 border-t border-gray-200 space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-50 focus:z-10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingRole}
                                    className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all border border-red-950"
                                >
                                    {isCreatingRole ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Role
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Edit Role Modal */}
                <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="3xl">
                    <div className="overflow-hidden rounded-xl bg-white flex flex-col max-h-[85vh]">
                        {/* Top Decorative Accent Gradient */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950 shrink-0"></div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-900 flex items-center justify-center shadow-xs">
                                    <Edit2 className="w-5 h-5 text-red-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">Edit Role & Permissions</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Modify role name and grant module capabilities.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-red-900 hover:bg-red-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 overflow-y-auto grow">
                            <form id="edit-role-form" onSubmit={handleUpdateRole}>
                                <div className="mb-6">
                                    <label htmlFor="editRoleName" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Role Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            id="editRoleName"
                                            value={editingRole?.name || ''}
                                            onChange={(e) => setEditingRole(editingRole ? { ...editingRole, name: e.target.value } : null)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-900/20 focus:border-red-900 block w-full pl-9 p-2.5 font-sans transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-base font-bold text-gray-900 font-serif mb-1">Assign Permissions</h4>
                                    <p className="text-xs text-gray-500 mb-4">Select the permissions this role will have across the system modules.</p>

                                    <div className="space-y-6">
                                        {Object.entries(permissionsByModule).map(([moduleName, permissions]) => {
                                            const modulePermIds = permissions.flatMap((p) => p.ids);
                                            const isAllSelected = modulePermIds.every((id) => editingRole?.permissions.includes(id));
                                            const isPartiallySelected = !isAllSelected && modulePermIds.some((id) => editingRole?.permissions.includes(id));

                                            return (
                                                <div key={moduleName} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3 border-b border-gray-200/80 pb-3">
                                                        <h5 className="font-bold text-gray-900 text-sm font-serif">{moduleName}</h5>
                                                        <label className="flex items-center space-x-2 cursor-pointer relative">
                                                            <div className="flex items-center h-5">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAllSelected}
                                                                    ref={input => {
                                                                        if (input) input.indeterminate = isPartiallySelected;
                                                                    }}
                                                                    onChange={(e) => handleSelectAllModule(moduleName, e.target.checked)}
                                                                    className="w-4 h-4 text-red-900 bg-white border-gray-300 rounded focus:ring-red-900 focus:ring-2"
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-600">Select All in Module</span>
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                                        {permissions.map((perm) => {
                                                            const isChecked = perm.ids.some((id) => editingRole?.permissions.includes(id));
                                                            return (
                                                                <label
                                                                    key={perm.id}
                                                                    className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${isChecked
                                                                            ? 'bg-red-50/80 border-red-200 shadow-xs'
                                                                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => handlePermissionToggle(perm)}
                                                                            className="w-4 h-4 text-red-900 bg-white border-gray-300 rounded focus:ring-red-900 focus:ring-2 transition-colors cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <span className={`text-xs font-medium capitalize truncate ${isChecked ? 'text-red-950 font-semibold' : 'text-gray-700'
                                                                        }`}>
                                                                        {perm.displayName}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 shrink-0 space-x-3 bg-gray-50/80">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-50 focus:z-10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-role-form"
                                className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center shadow-sm transition-all border border-red-950"
                            >
                                Update Role & Permissions
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white">
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-red-800 shrink-0"></div>
                        <div className="p-6 text-center">
                            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900 font-serif">
                                Delete Role
                            </h3>
                            <p className="mb-6 text-sm text-gray-500">
                                Are you sure you want to delete the role <strong className="text-gray-900">"{roleToDelete?.name}"</strong>?
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="text-gray-700 bg-white hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-all"
                                >
                                    No, cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteRole}
                                    className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold text-xs uppercase tracking-wider rounded-lg inline-flex items-center px-5 py-2.5 text-center shadow-sm transition-all border border-red-800"
                                >
                                    Yes, delete it
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Success Notification Modal */}
                <Modal show={successModal.isOpen} onClose={() => setSuccessModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-xl bg-white">
                        <div className="h-1.5 w-full bg-gradient-to-r from-green-600 to-green-800 shrink-0"></div>
                        <div className="p-6 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Success!</h3>
                            <p className="mb-6 text-sm text-gray-600">{successModal.message}</p>
                            <button
                                type="button"
                                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                                className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center transition-all shadow-sm"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Unauthorized Action Modal */}
                <Modal show={unauthorizedModal.isOpen} onClose={() => setUnauthorizedModal({ isOpen: false, message: '' })} maxWidth="sm">
                    <div className="overflow-hidden rounded-xl bg-white">
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-red-800 shrink-0"></div>
                        <div className="p-6 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Permission Required</h3>
                            <p className="mb-6 text-sm text-gray-600">{unauthorizedModal.message}</p>
                            <button
                                type="button"
                                onClick={() => setUnauthorizedModal({ isOpen: false, message: '' })}
                                className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center transition-all shadow-sm"
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