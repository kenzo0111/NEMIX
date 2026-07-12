import { Head, router, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useEffect, useState } from 'react';
import Select from 'react-select';

interface Staff {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
}

const defaultRoleOptions = [
    { value: 'System Admin', label: 'System Admin' },
    { value: 'Property Staff', label: 'Property Staff' },
    { value: 'Internal Auditor', label: 'Internal Auditor' },
    { value: 'External Auditor', label: 'External Auditor' },
];

const createRoleSelectStyles = {
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

const editRoleSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#4f46e5' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(79, 70, 229, 0.15)' : 'none',
        '&:hover': { borderColor: '#4f46e5' },
        minHeight: '42px',
        fontSize: '0.875rem',
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : 'white',
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
    const [collapsed, setCollapsed] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
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

    const roleOptions = roles.length
        ? roles.map((role) => ({ value: role, label: role }))
        : defaultRoleOptions;

    useEffect(() => {
        if (!flash?.success) {
            return;
        }

        setSuccessMessage(flash.success);
        const timeoutId = window.setTimeout(() => setSuccessMessage(''), 5000);

        return () => window.clearTimeout(timeoutId);
    }, [flash]);

    const modules = getSidebarModules('Access', 'Manage Staffs');

    const handleCreateStaff = (e: React.FormEvent) => {
        e.preventDefault();
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
        setSelectedStaff(staff);
        setEditStaffName(staff.name);
        setEditStaffEmail(staff.email);
        setEditStaffRole(staff.role);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        setSelectedStaff(staff);
        setIsDisableModalOpen(true);
    };

    const handleDisableConfirm = () => {
        if (!selectedStaff) return;

        router.patch(route('access-control.staffs.toggle-status', selectedStaff.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDisableModalOpen(false);
                setSelectedStaff(null);
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Access Control - Manage Staffs" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-5 flex flex-col justify-center">
                    <div className="mb-2">
                        <Breadcrumbs items={[{name:'Access Control'},{name:'Manage Staffs'}]} />
                    </div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Supply and Property Management Office - Staffs</h2>
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
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="flex-shrink-0 text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p className="text-sm font-medium text-green-800 flex-1">{successMessage}</p>
                            <button type="button" onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800" aria-label="Close message"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                    )}
                    
                    {/* Header Section */}
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                Manage user accounts, assign roles, and send registration email links for access.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-red-900 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-800 focus:bg-red-800 active:bg-red-950 transition ease-in-out duration-150">
                            Add New Staff
                        </button>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name Context</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {staffs.map((staff) => (
                                            <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                                            <span className="text-xs font-bold">{staff.name.charAt(0)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                                            <div className="text-sm text-gray-500">{staff.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{staff.role}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => handleEditClick(staff)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDisableClick(staff)}
                                                        className={staff.status === 'Active' ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                                    >
                                                        {staff.status === 'Active' ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Create Staff Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-xl">
                                    <h3 className="text-xl font-bold text-red-950 font-serif">Add New Staff</h3>
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
                                    <form onSubmit={handleCreateStaff} className="space-y-4">
                                        <div>
                                            <label htmlFor="staffName" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Full Name</label>
                                            <input 
                                                type="text" 
                                                id="staffName" 
                                                value={newStaffName}
                                                onChange={(e) => setNewStaffName(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-900 focus:border-red-900 block w-full p-2.5 font-sans" 
                                                placeholder="e.g. Jane Doe" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="staffEmail" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Email Address</label>
                                            <input 
                                                type="email" 
                                                id="staffEmail" 
                                                value={newStaffEmail}
                                                onChange={(e) => setNewStaffEmail(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-900 focus:border-red-900 block w-full p-2.5 font-sans" 
                                                placeholder="e.g. jane@example.com" 
                                                required 
                                            />
                                            <p className="mt-2 text-xs text-gray-500">A registration link will be sent to this email.</p>
                                        </div>
                                        <div>
                                            <label htmlFor="staffRole" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Assign Role</label>
                                            <Select
                                                inputId="staffRole"
                                                value={roleOptions.find((option) => option.value === newStaffRole) || null}
                                                onChange={(selected) => setNewStaffRole(selected?.value || 'Property Staff')}
                                                options={roleOptions}
                                                styles={createRoleSelectStyles}
                                                classNamePrefix="react-select"
                                                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end mt-6 space-x-3 pt-4 border-t border-gray-100">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsCreateModalOpen(false)}
                                                className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 focus:z-10"
                                            >
                                                Cancel
                                            </button>
                                                <button 
                                                type="submit" 
                                                disabled={isAddingStaff}
                                                className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isAddingStaff ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Adding...
                                                    </>
                                                ) : 'Add Staff'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Staff Modal */}
                {isEditModalOpen && selectedStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-xl">
                                    <h3 className="text-xl font-bold text-gray-900 font-serif">Edit Staff</h3>
                                    <button 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
                                    >
                                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <form onSubmit={handleEditSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="editStaffName" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Full Name</label>
                                            <input 
                                                type="text" 
                                                id="editStaffName" 
                                                value={editStaffName}
                                                onChange={(e) => setEditStaffName(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-sans" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="editStaffEmail" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Email Address</label>
                                            <input 
                                                type="email" 
                                                id="editStaffEmail" 
                                                value={editStaffEmail}
                                                readOnly
                                                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-sans cursor-not-allowed" 
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="editStaffRole" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Assign Role</label>
                                            <Select
                                                inputId="editStaffRole"
                                                value={roleOptions.find((option) => option.value === editStaffRole) || null}
                                                onChange={(selected) => setEditStaffRole(selected?.value || '')}
                                                options={roleOptions}
                                                styles={editRoleSelectStyles}
                                                classNamePrefix="react-select"
                                                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end mt-6 space-x-3 pt-4 border-t border-gray-100">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsEditModalOpen(false)}
                                                className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 focus:z-10"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isUpdatingStaff}
                                                className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Disable/Enable Confirmation Modal */}
                {isDisableModalOpen && selectedStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm transition-opacity">
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                                <div className="p-6 text-center">
                                    <svg className={`mx-auto mb-4 w-12 h-12 ${selectedStaff.status === 'Active' ? 'text-red-500' : 'text-green-500'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                    </svg>
                                    <h3 className="mb-5 text-lg font-normal text-gray-500">
                                        Are you sure you want to {selectedStaff.status === 'Active' ? 'disable' : 'enable'} the account for <strong>{selectedStaff.name}</strong>?
                                    </h3>
                                    <div className="flex justify-center space-x-3">
                                        <button 
                                            onClick={() => setIsDisableModalOpen(false)}
                                            className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                                        >
                                            No, cancel
                                        </button>
                                        <button 
                                            onClick={handleDisableConfirm}
                                            className={`text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center ${selectedStaff.status === 'Active' ? 'bg-red-600 hover:bg-red-800 focus:ring-red-300' : 'bg-green-600 hover:bg-green-800 focus:ring-green-300'}`}
                                        >
                                            Yes, I'm sure
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}