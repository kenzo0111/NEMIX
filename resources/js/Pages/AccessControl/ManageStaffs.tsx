import SystemModeBadge from '@/Components/SystemModeBadge';
import { Head, router, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import {
    UserPlus,
    User,
    Mail,
    X,
    AlertTriangle,
    Search,
    Edit2,
    Users,
    UserCheck,
    UserX,
    ShieldCheck,
    Info,
    Check,
    Shield
} from 'lucide-react';

interface Staff {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    email_verified?: boolean;
}

const defaultRoleOptions = [
    { value: 'System Admin', label: 'System Admin' },
    { value: 'Property Staff', label: 'Property Staff' },
    { value: 'Internal Auditor', label: 'Internal Auditor' },
    { value: 'External Auditor', label: 'External Auditor' },
];

const statusFilterOptions = [
    { value: 'Active', label: 'Active Status' },
    { value: 'Disabled', label: 'Disabled Status' },
];

const selectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '150px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '600',
        backgroundColor: '#ffffff',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '7px 12px',
        fontSize: '0.8125rem',
        fontWeight: '600',
        cursor: 'pointer',
    }),
    menu: (provided: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        zIndex: 50,
    }),
    menuPortal: (provided: any) => ({
        ...provided,
        zIndex: 60,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};

const modalRoleSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(127, 29, 29, 0.15)' : 'none',
        '&:hover': { borderColor: '#7f1d1d' },
        minHeight: '42px',
        fontSize: '0.875rem',
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
        cursor: 'pointer',
        fontSize: '0.875rem',
    }),
    menu: (provided: any) => ({
        ...provided,
        zIndex: 60,
    }),
    menuPortal: (provided: any) => ({
        ...provided,
        zIndex: 60,
    }),
};

export default function ManageStaffs({ auth, staffs = [], roles = [] }: { auth: any; staffs?: Staff[]; roles?: string[] }) {
    const user = auth?.user;
    const { flash } = usePage().props as any;

    const isSystemAdmin = Boolean(
        auth?.is_system_admin ||
        auth?.user?.role === 'System Admin' ||
        auth?.user?.role === 'System Administrator' ||
        (Array.isArray(auth?.user?.roles) && (
            auth.user.roles.includes('System Admin') ||
            auth.user.roles.includes('System Administrator') ||
            auth.user.roles.some((r: any) =>
                typeof r === 'string'
                    ? r === 'System Admin' || r === 'System Administrator'
                    : r?.name === 'System Admin' || r?.name === 'System Administrator'
            )
        ))
    );

    const canAddStaff = isSystemAdmin;
    const canEditStaff = isSystemAdmin;
    const canToggleStaff = isSystemAdmin;
    const canResendInvite = isSystemAdmin;

    const [collapsed, setCollapsed] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [warningMessage, setWarningMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [resendingStaffId, setResendingStaffId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffEmail, setNewStaffEmail] = useState('');
    const [newStaffRole, setNewStaffRole] = useState('Property Staff');

    const [editStaffName, setEditStaffName] = useState('');
    const [editStaffEmail, setEditStaffEmail] = useState('');
    const [editStaffRole, setEditStaffRole] = useState('');
    const [isAddingStaff, setIsAddingStaff] = useState(false);
    const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<{ value: string; label: string } | null>(null);

    const roleOptions = useMemo(() => {
        return roles.length > 0
            ? roles.map((role) => ({ value: role, label: role }))
            : defaultRoleOptions;
    }, [roles]);

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            const timeoutId = window.setTimeout(() => setSuccessMessage(''), 7000);
            return () => window.clearTimeout(timeoutId);
        }
        if (flash?.warning) {
            setWarningMessage(flash.warning);
            const timeoutId = window.setTimeout(() => setWarningMessage(''), 9000);
            return () => window.clearTimeout(timeoutId);
        }
        if (flash?.error) {
            setErrorMessage(flash.error);
            const timeoutId = window.setTimeout(() => setErrorMessage(''), 9000);
            return () => window.clearTimeout(timeoutId);
        }
    }, [flash]);

    const handleResendInvitation = (staff: Staff) => {
        if (!canResendInvite) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to resend invitations.');
            return;
        }

        router.post(route('access-control.staffs.resend-invitation', staff.id), {}, {
            preserveScroll: true,
            onStart: () => setResendingStaffId(staff.id),
            onFinish: () => setResendingStaffId(null),
        });
    };

    const modules = getSidebarModules('Access', 'Manage Staffs');

    // Filtered staff records
    const filteredStaffs = useMemo(() => {
        return staffs.filter((staff) => {
            if (selectedStatusFilter?.value && staff.status !== selectedStatusFilter.value) {
                return false;
            }
            if (searchQuery.trim() !== '') {
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

    // Statistics calculations
    const stats = useMemo(() => {
        const total = staffs.length;
        const active = staffs.filter((s) => s.status === 'Active').length;
        const disabled = staffs.filter((s) => s.status !== 'Active').length;
        const rolesAssigned = new Set(staffs.map((s) => s.role)).size;
        return { total, active, disabled, rolesAssigned };
    }, [staffs]);

    const handleCreateStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canAddStaff) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to add staff.');
            setIsCreateModalOpen(false);
            return;
        }
        if (!newStaffName.trim() || !newStaffEmail.trim()) return;

        router.post(route('access-control.staffs.store'), {
            name: newStaffName,
            email: newStaffEmail,
            role: newStaffRole,
        }, {
            preserveScroll: true,
            onStart: () => setIsAddingStaff(true),
            onFinish: () => setIsAddingStaff(false),
            onSuccess: () => {
                setNewStaffName('');
                setNewStaffEmail('');
                setNewStaffRole('Property Staff');
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleEditClick = (staff: Staff) => {
        if (!canEditStaff) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to edit staff.');
            return;
        }
        setSelectedStaff(staff);
        setEditStaffName(staff.name);
        setEditStaffEmail(staff.email);
        setEditStaffRole(staff.role);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEditStaff) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to edit staff.');
            setIsEditModalOpen(false);
            setSelectedStaff(null);
            return;
        }
        if (!editStaffName.trim() || !editStaffEmail.trim() || !selectedStaff) return;

        router.put(route('access-control.staffs.update', selectedStaff.id), {
            name: editStaffName,
            email: editStaffEmail,
            role: editStaffRole,
        }, {
            preserveScroll: true,
            onStart: () => setIsUpdatingStaff(true),
            onFinish: () => setIsUpdatingStaff(false),
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedStaff(null);
            },
        });
    };

    const handleDisableClick = (staff: Staff) => {
        if (!canToggleStaff) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to change account status.');
            return;
        }
        if (staff.id === user?.id) {
            setErrorMessage('You cannot disable your own account.');
            return;
        }
        setSelectedStaff(staff);
        setIsDisableModalOpen(true);
    };

    const handleDisableConfirm = () => {
        if (!selectedStaff) return;

        if (!canToggleStaff) {
            setErrorMessage('Unauthorized action. System Administrator privileges are required to change account status.');
            setIsDisableModalOpen(false);
            setSelectedStaff(null);
            return;
        }

        if (selectedStaff.id === user?.id) {
            setErrorMessage('You cannot disable your own account.');
            setIsDisableModalOpen(false);
            setSelectedStaff(null);
            return;
        }

        router.patch(route('access-control.staffs.toggle-status', selectedStaff.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDisableModalOpen(false);
                setSelectedStaff(null);
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Access Control - Manage Staffs" />

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
                            <span className="hidden md:inline text-red-200/80">Supply and Inventory Management System (SIMS)</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Access Control' }, { name: 'Manage Staffs' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Supply & Property Management Office - Staff Accounts</h2>
                            <p className="text-xs text-gray-500 font-medium">Manage user accounts, assign administrative roles, and control access permissions</p>
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
                    {/* Success Alert Banner */}
                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 shadow-xs">
                            <div className="flex-shrink-0 text-emerald-600">
                                <Check className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-emerald-900 flex-1">{successMessage}</p>
                            <button
                                type="button"
                                onClick={() => setSuccessMessage('')}
                                className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition-colors"
                                aria-label="Close message"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Warning Alert Banner */}
                    {warningMessage && (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3 shadow-xs">
                            <div className="flex-shrink-0 text-amber-600 mt-0.5">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">Mailer Warning</h4>
                                <p className="text-xs font-medium text-amber-800 mt-0.5">{warningMessage}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWarningMessage('')}
                                className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors"
                                aria-label="Close message"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Error Alert Banner */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-xs">
                            <div className="flex-shrink-0 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-red-900 flex-1">{errorMessage}</p>
                            <button
                                type="button"
                                onClick={() => setErrorMessage('')}
                                className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                aria-label="Close message"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Non-Admin Read-Only Notice Banner */}
                    {!isSystemAdmin && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 shadow-xs">
                            <div className="p-2 bg-slate-200 rounded-lg text-slate-800 shrink-0">
                                <Shield className="w-5 h-5 text-slate-700" />
                            </div>
                            <div className="text-xs text-slate-800 flex-1">
                                <strong className="font-bold uppercase tracking-wider block text-[11px] mb-0.5 text-slate-900">
                                    Directory View Mode (Standard Privileges):
                                </strong>
                                You have read-only access to the staff roster. Adding new staff members, editing accounts, and modifying user access statuses are restricted strictly to System Administrators.
                            </div>
                        </div>
                    )}

                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-red-50 border border-gray-200">
                                    <Users className="w-4 h-4 text-red-900" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-red-50 text-red-800 border border-red-200">
                                    REGISTERED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.total}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Total Staff Members</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Active & Disabled Accounts</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                    <UserCheck className="w-4 h-4 text-emerald-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    ACTIVE
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.active}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Active Accounts</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Authorized System Users</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                                    <UserX className="w-4 h-4 text-amber-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-amber-50 text-amber-800 border border-amber-200">
                                    DISABLED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.disabled}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Inactive / Suspended</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Access Suspended Accounts</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <ShieldCheck className="w-4 h-4 text-blue-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-50 text-blue-800 border border-blue-200">
                                    ASSIGNED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.rolesAssigned}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Configured Roles</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Role Profiles Assigned</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Staff Ledger Container */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">Configured Staff Accounts & Access Control</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-red-100 text-red-900 rounded-full border border-red-200">
                                        {filteredStaffs.length} {filteredStaffs.length === 1 ? 'Account' : 'Accounts'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Manage user directory, assign administrative system roles, and configure login availability</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search Bar */}
                                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search staff, email, role..."
                                        className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold border border-gray-300 rounded focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white"
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Status Filter */}
                                <Select
                                    options={statusFilterOptions}
                                    value={selectedStatusFilter}
                                    onChange={(opt: any) => setSelectedStatusFilter(opt)}
                                    styles={selectStyles}
                                    placeholder="Filter by Status"
                                    isClearable
                                />

                                {/* Reset Filter Button */}
                                {(selectedStatusFilter || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedStatusFilter(null);
                                            setSearchQuery('');
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                                        title="Reset filters"
                                    >
                                        Reset
                                    </button>
                                )}

                                {/* Add New Staff Button */}
                                {canAddStaff ? (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-900 hover:bg-red-800 border border-red-950 rounded font-bold text-xs text-white uppercase tracking-wider shadow-xs transition-colors"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Add New Staff</span>
                                    </button>
                                ) : (
                                    <div
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 border border-gray-300 rounded font-bold text-xs text-gray-400 uppercase tracking-wider select-none cursor-not-allowed"
                                        title="System Administrator privileges required to register staff"
                                    >
                                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Add Staff (Restricted)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Staff Table */}
                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-300 bg-gray-200/60 font-serif">
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/3">Staff Member</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/4">System Role</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Account Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase text-right w-1/4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {filteredStaffs.length > 0 ? (
                                        filteredStaffs.map((staff) => (
                                            <tr key={staff.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-red-900/10 text-red-950 font-bold flex items-center justify-center text-sm shrink-0 border border-red-900/20 shadow-2xs">
                                                            {staff.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 text-sm group-hover:text-red-900 transition-colors">{staff.name}</span>
                                                            <span className="text-[11px] text-gray-500 font-mono tracking-wide">{staff.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-blue-50 text-blue-800 border-blue-200/80 font-mono">
                                                        <Shield className="w-3 h-3 text-blue-700" />
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${staff.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                                        : 'bg-gray-100 text-gray-700 border-gray-300'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isSystemAdmin ? (
                                                            <>
                                                                {staff.status !== 'Active' && (
                                                                    <button
                                                                        onClick={() => handleResendInvitation(staff)}
                                                                        disabled={resendingStaffId === staff.id}
                                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                                                        title="Resend invitation email"
                                                                    >
                                                                        <Mail className="w-3.5 h-3.5" />
                                                                        <span>{resendingStaffId === staff.id ? 'Sending...' : 'Resend Invite'}</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleEditClick(staff)}
                                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors inline-flex items-center gap-1.5"
                                                                    title="Edit staff details and role"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDisableClick(staff)}
                                                                    disabled={staff.id === user?.id}
                                                                    title={staff.id === user?.id ? "You cannot disable your own account." : staff.status === 'Active' ? 'Disable staff account' : 'Enable staff account'}
                                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                                                                        staff.id === user?.id
                                                                            ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50 border-gray-200'
                                                                            : staff.status === 'Active'
                                                                                ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                                                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                                                        }`}
                                                                >
                                                                    {staff.status === 'Active' ? (
                                                                        <>
                                                                            <UserX className="w-3.5 h-3.5" />
                                                                            <span>Disable</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <UserCheck className="w-3.5 h-3.5" />
                                                                            <span>Enable</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 select-none" title="System Administrator privileges required to manage staff accounts">
                                                                <Shield className="w-3 h-3 text-gray-400" />
                                                                <span>Read Only</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="w-8 h-8 text-gray-300" />
                                                    <p className="font-medium text-gray-600">No staff accounts match your search criteria.</p>
                                                    {(searchQuery || selectedStatusFilter) && (
                                                        <button
                                                            onClick={() => {
                                                                setSearchQuery('');
                                                                setSelectedStatusFilter(null);
                                                            }}
                                                            className="text-xs font-bold text-red-900 hover:underline"
                                                        >
                                                            Clear filters and search query
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-700">{filteredStaffs.length}</span> of <span className="font-bold text-gray-700">{staffs.length}</span> staff accounts
                            </span>
                        </div>
                    </div>

                    {/* Security System Advisory Banner */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                            <Info className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-amber-900">
                            <strong className="font-bold uppercase tracking-wider block text-[11px] mb-0.5">Security System Advisory:</strong>
                            Account privilege changes and status toggles take effect automatically upon user re-authentication. Users currently active in the system will receive updated permissions on their next session.
                        </div>
                    </div>

                </div>

                {/* Create Staff Modal */}
                <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white">
                        {/* Decorative Accent Gradient */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950 shrink-0"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-900 flex items-center justify-center shadow-xs">
                                    <UserPlus className="w-5 h-5 text-red-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">Add New Staff</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Register a new staff member and assign their system role.</p>
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

                        {/* Modal Body */}
                        <form onSubmit={handleCreateStaff}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="staffName" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Full Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            id="staffName"
                                            value={newStaffName}
                                            onChange={(e) => setNewStaffName(e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-900/20 focus:border-red-900 block w-full pl-9 p-2.5 font-sans transition-all"
                                            placeholder="e.g. Jane Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="staffEmail" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Email Address <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            id="staffEmail"
                                            value={newStaffEmail}
                                            onChange={(e) => setNewStaffEmail(e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-900/20 focus:border-red-900 block w-full pl-9 p-2.5 font-sans transition-all"
                                            placeholder="e.g. jane@example.com"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1 font-medium">
                                        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        A registration link will automatically be dispatched to this email.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="staffRole" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Assign System Role <span className="text-red-600">*</span>
                                    </label>
                                    <Select
                                        inputId="staffRole"
                                        value={roleOptions.find((option) => option.value === newStaffRole) || null}
                                        onChange={(selected) => setNewStaffRole(selected?.value || 'Property Staff')}
                                        options={roleOptions}
                                        styles={modalRoleSelectStyles}
                                        classNamePrefix="react-select"
                                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
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
                                    disabled={isAddingStaff}
                                    className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all border border-red-950"
                                >
                                    {isAddingStaff ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding Staff...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Add Staff
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Edit Staff Modal */}
                <Modal show={isEditModalOpen && Boolean(selectedStaff)} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white">
                        {/* Top Decorative Accent Gradient */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 shrink-0"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 flex items-center justify-center shadow-xs">
                                    <User className="w-5 h-5 text-indigo-700" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">Edit Staff Details</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Update staff account information and system role assignment.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-indigo-900 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleEditSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="editStaffName" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Full Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            id="editStaffName"
                                            value={editStaffName}
                                            onChange={(e) => setEditStaffName(e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full pl-9 p-2.5 font-sans transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="editStaffEmail" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            id="editStaffEmail"
                                            value={editStaffEmail}
                                            readOnly
                                            className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-9 p-2.5 font-sans cursor-not-allowed text-gray-600"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">Email address cannot be modified.</p>
                                </div>

                                <div>
                                    <label htmlFor="editStaffRole" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 font-sans">
                                        Assign System Role <span className="text-red-600">*</span>
                                    </label>
                                    <Select
                                        inputId="editStaffRole"
                                        value={roleOptions.find((option) => option.value === editStaffRole) || null}
                                        onChange={(selected) => setEditStaffRole(selected?.value || '')}
                                        options={roleOptions}
                                        styles={modalRoleSelectStyles}
                                        classNamePrefix="react-select"
                                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                        menuPosition="fixed"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end px-6 py-4 bg-gray-50/80 border-t border-gray-200 space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-50 focus:z-10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingStaff}
                                    className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all border border-indigo-700"
                                >
                                    {isUpdatingStaff ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Disable/Enable Confirmation Modal */}
                <Modal show={isDisableModalOpen && Boolean(selectedStaff)} onClose={() => setIsDisableModalOpen(false)} maxWidth="md">
                    <div className="overflow-hidden rounded-xl bg-white">
                        <div className={`h-1.5 w-full shrink-0 ${selectedStaff?.status === 'Active' ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-emerald-600 to-emerald-800'}`}></div>
                        <div className="p-6 text-center">
                            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${selectedStaff?.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900 font-serif">
                                {selectedStaff?.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                            </h3>
                            <p className="mb-6 text-sm text-gray-500">
                                Are you sure you want to {selectedStaff?.status === 'Active' ? 'disable' : 'enable'} access for <strong className="text-gray-900">{selectedStaff?.name}</strong>?
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDisableModalOpen(false)}
                                    className="text-gray-700 bg-white hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-all"
                                >
                                    No, cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDisableConfirm}
                                    className={`text-white focus:ring-4 focus:outline-none font-bold text-xs uppercase tracking-wider rounded-lg inline-flex items-center px-5 py-2.5 text-center shadow-sm transition-all ${selectedStaff?.status === 'Active' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300'}`}
                                >
                                    Yes, confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}