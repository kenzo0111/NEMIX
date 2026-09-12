import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { Info } from 'lucide-react';
import {
    ManageRolePermissionPageProps,
    Role,
    RoleCapabilities,
    NotificationState,
} from './types';
import { groupPermissionsByModule, normalizePermission } from './permissionMetadata';
import AccessControlSummary from './Components/AccessControlSummary';
import RoleTable from './Components/RoleTable';
import CreateRoleDialog from './Components/CreateRoleDialog';
import EditRoleDialog from './Components/EditRoleDialog';
import DeleteRoleDialog from './Components/DeleteRoleDialog';
import RoleNotification from './Components/RoleNotification';

export default function RoleManagementIndex({
    auth,
    roles = [],
    permissions: rawPermissions = [],
    capabilities: providedCapabilities,
}: ManageRolePermissionPageProps) {
    const { flash } = usePage<ManageRolePermissionPageProps>().props;
    const user = auth?.user;

    // Sidebar collapse state with localStorage persistence
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    }, []);

    // Normalized permissions & grouping
    const normalizedPermissions = useMemo(() => {
        return rawPermissions.map(normalizePermission);
    }, [rawPermissions]);

    const permissionsByModule = useMemo(() => {
        return groupPermissionsByModule(normalizedPermissions);
    }, [normalizedPermissions]);

    const moduleNames = useMemo(() => Object.keys(permissionsByModule), [permissionsByModule]);

    // Capability authorization
    const capabilities: RoleCapabilities = useMemo(() => {
        if (providedCapabilities) {
            return providedCapabilities;
        }

        const isSysAdmin = Boolean(
            auth?.is_system_admin ||
            user?.role === 'System Admin' ||
            user?.role === 'System Administrator' ||
            (Array.isArray(user?.roles) &&
                (user.roles.includes('System Admin') ||
                    user.roles.includes('System Administrator')))
        );

        const perms = auth?.permissions || [];

        return {
            canCreate: isSysAdmin || perms.includes('route:access-control.role-permission.store'),
            canUpdate: isSysAdmin || perms.includes('route:access-control.role-permission.update'),
            canDelete: isSysAdmin || perms.includes('route:access-control.role-permission.destroy'),
        };
    }, [providedCapabilities, auth, user]);

    // Role search
    const [searchQuery, setSearchQuery] = useState('');
    const filteredRoles = useMemo(() => {
        if (!searchQuery.trim()) return roles;
        const q = searchQuery.toLowerCase().trim();
        return roles.filter(
            (role) =>
                role.name.toLowerCase().includes(q) ||
                String(role.id).includes(q)
        );
    }, [roles, searchQuery]);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    // Unified transient notification
    const [notification, setNotification] = useState<NotificationState | null>(null);

    useEffect(() => {
        if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
        } else if (flash?.warning) {
            setNotification({ type: 'warning', message: flash.warning });
        } else if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
        } else if (flash?.status) {
            setNotification({ type: 'info', message: flash.status });
        }
    }, [flash]);

    // Handlers
    const handleOpenCreate = () => {
        if (!capabilities.canCreate) {
            setNotification({
                type: 'warning',
                message: 'You do not have administrative permission to create roles.',
            });
            return;
        }
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (role: Role) => {
        if (!capabilities.canUpdate) {
            setNotification({
                type: 'warning',
                message: 'You do not have administrative permission to edit roles.',
            });
            return;
        }
        setEditingRole(role);
        setIsEditOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditOpen(false);
        setEditingRole(null);
    };

    const handleOpenDelete = (role: Role) => {
        if (role.is_system) {
            setNotification({
                type: 'error',
                message: `System role '${role.name}' is protected and cannot be deleted.`,
            });
            return;
        }

        if (!role.is_deletable) {
            setNotification({
                type: 'warning',
                message: `Role '${role.name}' cannot be deleted while staff members are assigned to it.`,
            });
            return;
        }

        if (!capabilities.canDelete) {
            setNotification({
                type: 'warning',
                message: 'You do not have administrative permission to delete roles.',
            });
            return;
        }

        setRoleToDelete(role);
        setIsDeleteOpen(true);
    };

    const handleCloseDelete = () => {
        setIsDeleteOpen(false);
        setRoleToDelete(null);
    };

    const sidebarModules = getSidebarModules('Access', 'Manage Role Permission');

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Role & Permission Management - Access Control" />

            <Sidebar
                modules={sidebarModules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                    collapsed ? 'md:ml-20' : 'md:ml-72'
                } ml-0`}
            >
                {/* 1. Page Header */}
                <PageHeader
                    title="Role & Permission Management"
                    description="Manage institutional roles and system access permissions."
                    breadcrumbs={[
                        { name: 'Access Control' },
                        { name: 'Role & Permission Management' },
                    ]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-6 max-w-[1600px] mx-auto pb-16 min-w-0 w-full">
                    {/* Unified Notification Feedback */}
                    <RoleNotification
                        notification={notification}
                        onDismiss={() => setNotification(null)}
                    />

                    {/* 2. Compact Access Control Summary */}
                    <AccessControlSummary
                        rolesCount={roles.length}
                        permissionsCount={normalizedPermissions.length}
                        modulesCount={moduleNames.length}
                    />

                    {/* 3. Role Directory */}
                    <RoleTable
                        roles={filteredRoles}
                        totalPermissionsCount={normalizedPermissions.length}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        canCreate={capabilities.canCreate}
                        canUpdate={capabilities.canUpdate}
                        canDelete={capabilities.canDelete}
                        onCreateRole={handleOpenCreate}
                        onEditRole={handleOpenEdit}
                        onDeleteRole={handleOpenDelete}
                    />

                    {/* 4. Security Advisory Notice */}
                    <section
                        aria-labelledby="security-notice-heading"
                        className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3.5 text-xs text-amber-950 shadow-2xs"
                    >
                        <div className="p-1.5 bg-amber-100/70 text-amber-800 rounded-lg border border-amber-200 shrink-0 mt-0.5">
                            <Info className="w-4 h-4" />
                        </div>
                        <div>
                            <h3
                                id="security-notice-heading"
                                className="font-bold text-amber-900 text-xs"
                            >
                                Permission Changes & Session Policy
                            </h3>
                            <p className="text-amber-900/90 text-xs mt-0.5 leading-relaxed">
                                Role and permission updates apply according to the system's current
                                authorization and session policy. Signed-in staff members will receive
                                updated capabilities upon their next request or upon refreshing their
                                active authentication token.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Dialogs */}
                <CreateRoleDialog
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                />

                <EditRoleDialog
                    isOpen={isEditOpen}
                    role={editingRole}
                    totalSystemPermissionsCount={normalizedPermissions.length}
                    permissionsByModule={permissionsByModule}
                    onClose={handleCloseEdit}
                />

                <DeleteRoleDialog
                    isOpen={isDeleteOpen}
                    role={roleToDelete}
                    onClose={handleCloseDelete}
                />
            </main>
        </div>
    );
}
