import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Shield, Check } from 'lucide-react'; // Optional: for icons
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useState, useEffect } from 'react';

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
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Access Control - Manage Role & Permission" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-5 flex flex-col justify-center">
                    <div className="mb-2">
                        <Breadcrumbs items={[{name:'Access Control'},{name:'Manage Role Permission'}]} />
                    </div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Roles & Permissions</h2>
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-6 max-w-7xl mx-auto pb-20">
                    
                    {/* Header Section */}
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                Define access levels and security settings for your users.
                            </p>
                        </div>
                        <button 
                            onClick={handleCreateClick}
                            className="inline-flex items-center px-4 py-2 bg-red-900 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-800 focus:bg-red-800 active:bg-red-950 transition ease-in-out duration-150">
                            Create New Role
                        </button>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions Assigned</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {roles.map((role) => (
                                            <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                                            <span className="text-xs font-bold">{role.name.charAt(0)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {role.permissions_count} Permissions
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleEditAction(role)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                                    <button onClick={() => handleDeleteAction(role)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Help Note / Footer */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> Changes to permissions will take effect the next time a user logs in.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Create Role Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-xl">
                                    <h3 className="text-xl font-bold text-red-950 font-serif">Create New Role</h3>
                                    <button 
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
                                    >
                                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <form onSubmit={handleCreateRole}>
                                        <div>
                                            <label htmlFor="roleName" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Role Name</label>
                                            <input 
                                                type="text" 
                                                id="roleName" 
                                                value={newRoleName}
                                                onChange={(e) => setNewRoleName(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-900 focus:border-red-900 block w-full p-2.5 font-sans" 
                                                placeholder="e.g. Audit Manager" 
                                                required 
                                            />
                                        </div>
                                        <div className="flex items-center justify-end mt-6 space-x-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsCreateModalOpen(false)}
                                                className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 focus:z-10"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isCreatingRole}
                                                className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isCreatingRole ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Creating...
                                                    </>
                                                ) : 'Create Role'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Role Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-3xl p-4 mx-auto my-8 max-h-[90vh] flex flex-col">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col max-h-full">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-xl shrink-0">
                                    <h3 className="text-xl font-bold text-red-950 font-serif">Edit Role & Permissions</h3>
                                    <button 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
                                    >
                                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-5 space-y-6 overflow-y-auto grow">
                                    <form id="edit-role-form" onSubmit={handleUpdateRole}>
                                        <div className="mb-6">
                                            <label htmlFor="editRoleName" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Role Name</label>
                                            <input 
                                                type="text" 
                                                id="editRoleName" 
                                                value={editingRole?.name || ''}
                                                onChange={(e) => setEditingRole(editingRole ? { ...editingRole, name: e.target.value } : null)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-900 focus:border-red-900 block w-full p-2.5 font-sans" 
                                                required 
                                            />
                                        </div>

                                        <div className="border-t border-gray-200 py-4">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Assign Permissions</h4>
                                            <p className="text-sm text-gray-500 mb-4">Select the permissions this role will have across the system modules.</p>
                                            
                                            <div className="space-y-6">
                                                {Object.entries(permissionsByModule).map(([moduleName, permissions]) => {
                                                    const modulePermIds = permissions.flatMap((p) => p.ids);
                                                    const isAllSelected = modulePermIds.every((id) => editingRole?.permissions.includes(id));
                                                    const isPartiallySelected = !isAllSelected && modulePermIds.some((id) => editingRole?.permissions.includes(id));

                                                    return (
                                                        <div key={moduleName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                                                <h5 className="font-semibold text-gray-800">{moduleName}</h5>
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
                                                                    <span className="text-sm font-medium text-gray-700">Select All in Module</span>
                                                                </label>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                                                {permissions.map((perm) => {
                                                                    const isChecked = perm.ids.some((id) => editingRole?.permissions.includes(id));
                                                                    return (
                                                                        <label 
                                                                            key={perm.id} 
                                                                            className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${
                                                                                isChecked 
                                                                                ? 'bg-red-50 border-red-200 shadow-sm' 
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
                                                                            <span className={`text-sm font-medium capitalize truncate ${
                                                                                isChecked ? 'text-red-900' : 'text-gray-700'
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
                                <div className="flex items-center justify-end p-5 border-t border-gray-100 shrink-0 space-x-3 bg-gray-50 rounded-b-xl">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 focus:z-10"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        form="edit-role-form"
                                        className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
                                    >
                                        Update Role & Permissions
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 p-6 text-center">
                                <Trash2 className="mx-auto mb-4 text-red-500 w-12 h-12" />
                                <h3 className="mb-5 text-lg font-normal text-gray-500">
                                    Are you sure you want to delete the role <span className="font-bold text-gray-900">"{roleToDelete?.name}"</span>?
                                </h3>
                                <div className="flex justify-center space-x-3">
                                    <button 
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 transition-colors"
                                    >
                                        No, cancel
                                    </button>
                                    <button 
                                        onClick={confirmDeleteRole}
                                        className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center transition-colors"
                                    >
                                        Yes, delete it
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Notification Modal */}
                {successModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-sm p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-green-100 p-6 text-center flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 p-2 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                                <p className="mb-6 text-sm text-gray-600">{successModal.message}</p>
                                <button 
                                    onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                                    className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Unauthorized Action Modal */}
                {unauthorizedModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-sm p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-red-100 p-6 text-center flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 p-2 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Permission Required</h3>
                                <p className="mb-6 text-sm text-gray-600">{unauthorizedModal.message}</p>
                                <button 
                                    onClick={() => setUnauthorizedModal({ isOpen: false, message: '' })}
                                    className="w-full text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}