import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    ManageStaffsPageProps,
    Staff,
    SelectOption,
    StaffStats,
    NotificationState,
    StaffCapabilities,
} from './types';
import StaffSummary from './components/StaffSummary';
import StaffFilters from './components/StaffFilters';
import StaffTable from './components/StaffTable';
import CreateStaffModal from './components/CreateStaffModal';
import EditStaffModal from './components/EditStaffModal';
import AccountStatusModal from './components/AccountStatusModal';
import SecurityNotice from './components/SecurityNotice';
import StaffNotification from './components/StaffNotification';
import ReadOnlyNotice from './components/ReadOnlyNotice';

const defaultRoleOptions: SelectOption[] = [
    { value: 'System Admin', label: 'System Admin' },
    { value: 'Property Staff', label: 'Property Staff' },
    { value: 'Internal Auditor', label: 'Internal Auditor' },
    { value: 'External Auditor', label: 'External Auditor' },
];

export default function StaffManagementIndex({
    auth,
    staffs = [],
    roles = [],
    capabilities: providedCapabilities,
}: ManageStaffsPageProps) {
    const { flash } = usePage<ManageStaffsPageProps>().props;
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

    // Normalized Capability-Based Authorization
    const capabilities: StaffCapabilities = useMemo(() => {
        if (providedCapabilities) {
            return providedCapabilities;
        }

        const isSysAdmin = Boolean(
            auth?.is_system_admin ||
            auth?.user?.role === 'System Admin' ||
            auth?.user?.role === 'System Administrator' ||
            (Array.isArray(auth?.user?.roles) &&
                (auth.user.roles.includes('System Admin') ||
                    auth.user.roles.includes('System Administrator')))
        );

        return {
            canCreate: isSysAdmin,
            canUpdate: isSysAdmin,
            canToggleStatus: isSysAdmin,
            canResendInvitation: isSysAdmin,
        };
    }, [providedCapabilities, auth]);

    const isReadOnly = !capabilities.canCreate && !capabilities.canUpdate && !capabilities.canToggleStatus;

    // Single unified transient notification state
    const [notification, setNotification] = useState<NotificationState | null>(null);

    useEffect(() => {
        if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
        } else if (flash?.warning) {
            setNotification({ type: 'warning', message: flash.warning, title: 'Mailer Advisory' });
        } else if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
        } else if (flash?.status) {
            setNotification({ type: 'info', message: flash.status });
        }
    }, [flash]);

    useEffect(() => {
        if (!notification) return;
        const duration = notification.type === 'error' || notification.type === 'warning' ? 9000 : 6000;
        const timer = window.setTimeout(() => setNotification(null), duration);
        return () => window.clearTimeout(timer);
    }, [notification]);

    // Search and filtering state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<SelectOption | null>(null);

    // Modals and action states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [isStatusProcessing, setIsStatusProcessing] = useState(false);
    const [resendingStaffId, setResendingStaffId] = useState<number | null>(null);

    // Format role options
    const roleOptions = useMemo<SelectOption[]>(() => {
        return roles.length > 0
            ? roles.map((role) => ({ value: role, label: role }))
            : defaultRoleOptions;
    }, [roles]);

    // Filter staff roster
    const filteredStaffs = useMemo(() => {
        return staffs.filter((staff) => {
            if (selectedStatusFilter?.value) {
                const isLookingForActive = selectedStatusFilter.value === 'Active';
                const staffIsActive = staff.status === 'Active';
                if (isLookingForActive !== staffIsActive) {
                    return false;
                }
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = staff.name.toLowerCase().includes(q);
                const emailMatch = staff.email.toLowerCase().includes(q);
                const roleMatch = staff.role.toLowerCase().includes(q);
                const statusMatch = staff.status.toLowerCase().includes(q);
                return nameMatch || emailMatch || roleMatch || statusMatch;
            }

            return true;
        });
    }, [staffs, searchQuery, selectedStatusFilter]);

    // Compute roster statistics
    const stats: StaffStats = useMemo(() => {
        const total = staffs.length;
        const active = staffs.filter((s) => s.status === 'Active').length;
        const disabled = staffs.filter((s) => s.status !== 'Active').length;
        const rolesAssigned = new Set(staffs.map((s) => s.role)).size;
        return { total, active, disabled, rolesAssigned };
    }, [staffs]);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedStatusFilter(null);
    }, []);

    // Action Handlers
    const handleOpenCreateModal = useCallback(() => {
        if (!capabilities.canCreate) {
            setNotification({
                type: 'error',
                message: 'Unauthorized action. System Administrator privileges are required to register staff.',
            });
            return;
        }
        setIsCreateModalOpen(true);
    }, [capabilities.canCreate]);

    const handleEditClick = useCallback((staff: Staff) => {
        if (!capabilities.canUpdate) {
            setNotification({
                type: 'error',
                message: 'Unauthorized action. System Administrator privileges are required to edit staff.',
            });
            return;
        }
        setSelectedStaff(staff);
        setIsEditModalOpen(true);
    }, [capabilities.canUpdate]);

    const handleToggleStatusClick = useCallback(
        (staff: Staff) => {
            if (!capabilities.canToggleStatus) {
                setNotification({
                    type: 'error',
                    message: 'Unauthorized action. System Administrator privileges are required to modify access status.',
                });
                return;
            }
            if (staff.id === user?.id) {
                setNotification({
                    type: 'error',
                    message: 'You cannot disable your own account.',
                });
                return;
            }
            setSelectedStaff(staff);
            setIsStatusModalOpen(true);
        },
        [capabilities.canToggleStatus, user?.id]
    );

    const handleConfirmStatusToggle = useCallback(() => {
        if (!selectedStaff) return;

        if (!capabilities.canToggleStatus) {
            setNotification({
                type: 'error',
                message: 'Unauthorized action. System Administrator privileges are required to change account status.',
            });
            setIsStatusModalOpen(false);
            setSelectedStaff(null);
            return;
        }

        if (selectedStaff.id === user?.id) {
            setNotification({
                type: 'error',
                message: 'You cannot disable your own account.',
            });
            setIsStatusModalOpen(false);
            setSelectedStaff(null);
            return;
        }

        setIsStatusProcessing(true);
        router.patch(
            route('access-control.staffs.toggle-status', selectedStaff.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsStatusProcessing(false);
                    setIsStatusModalOpen(false);
                    setSelectedStaff(null);
                },
            }
        );
    }, [selectedStaff, capabilities.canToggleStatus, user?.id]);

    const handleResendInvitation = useCallback(
        (staff: Staff) => {
            if (!capabilities.canResendInvitation) {
                setNotification({
                    type: 'error',
                    message: 'Unauthorized action. System Administrator privileges are required to resend invitations.',
                });
                return;
            }

            router.post(
                route('access-control.staffs.resend-invitation', staff.id),
                {},
                {
                    preserveScroll: true,
                    onStart: () => setResendingStaffId(staff.id),
                    onFinish: () => setResendingStaffId(null),
                }
            );
        },
        [capabilities.canResendInvitation]
    );

    const modules = getSidebarModules('Access', 'Manage Staffs');

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Staff Management - Access Control" />

            <Sidebar
                modules={modules}
                user={user || undefined}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    collapsed ? 'ml-20' : 'ml-72'
                }`}
            >
                <PageHeader
                    title="Staff Management"
                    description="Manage university staff accounts, assign administrative roles, and configure access permissions."
                    breadcrumbs={[{ name: 'Access Control' }, { name: 'Manage Staffs' }]}
                />

                <div className="p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto pb-16">
                    {/* Transient Application Notification (Single Banner) */}
                    <StaffNotification
                        notification={notification}
                        onDismiss={() => setNotification(null)}
                    />

                    {/* Permanent Directory Read-Only Mode Banner */}
                    {isReadOnly && <ReadOnlyNotice />}

                    {/* Institutional Summary Strip */}
                    <StaffSummary stats={stats} />

                    {/* Filter and Action Toolbar */}
                    <StaffFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={selectedStatusFilter}
                        onStatusFilterChange={setSelectedStatusFilter}
                        onResetFilters={handleResetFilters}
                        onOpenCreateModal={handleOpenCreateModal}
                        canAddStaff={capabilities.canCreate}
                    />

                    {/* Primary Content: Staff Table */}
                    <StaffTable
                        staffs={filteredStaffs}
                        totalStaffCount={staffs.length}
                        currentUserId={user?.id}
                        canEdit={capabilities.canUpdate}
                        canToggleStatus={capabilities.canToggleStatus}
                        canResendInvite={capabilities.canResendInvitation}
                        resendingStaffId={resendingStaffId}
                        searchQuery={searchQuery}
                        hasActiveFilters={Boolean(searchQuery || selectedStatusFilter)}
                        onResetFilters={handleResetFilters}
                        onEdit={handleEditClick}
                        onToggleStatus={handleToggleStatusClick}
                        onResendInvitation={handleResendInvitation}
                    />

                    {/* Security Advisory Panel */}
                    <SecurityNotice />
                </div>

                {/* Create Staff Modal */}
                <CreateStaffModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    roleOptions={roleOptions}
                    defaultRole="Property Staff"
                />

                {/* Edit Staff Modal */}
                <EditStaffModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedStaff(null);
                    }}
                    staff={selectedStaff}
                    roleOptions={roleOptions}
                />

                {/* Account Status Modal */}
                <AccountStatusModal
                    isOpen={isStatusModalOpen}
                    onClose={() => {
                        setIsStatusModalOpen(false);
                        setSelectedStaff(null);
                    }}
                    staff={selectedStaff}
                    isProcessing={isStatusProcessing}
                    onConfirm={handleConfirmStatusToggle}
                />
            </main>
        </div>
    );
}
