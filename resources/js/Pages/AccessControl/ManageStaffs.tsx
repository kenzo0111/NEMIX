import { Head } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useState } from 'react';

export default function ManageStaffs({ auth }: { auth: any }) {
    const user = auth?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffEmail, setNewStaffEmail] = useState('');
    const [newStaffRole, setNewStaffRole] = useState('Property Staff');
    const modules = getSidebarModules('Access', 'Manage Staffs');

    // Mock data - replace with props from Inertia
    const [staffs, setStaffs] = useState([
        { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'System Admin', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Property Staff', status: 'Active' },
        { id: 3, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Internal Auditor', status: 'Inactive' },
    ]);

    const handleCreateStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaffName.trim() || !newStaffEmail.trim()) return;

        // Add to mock data - replace with actual Inertia post request
        setStaffs([...staffs, {
            id: staffs.length + 1,
            name: newStaffName,
            email: newStaffEmail,
            role: newStaffRole,
            status: 'Active'
        }]);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffRole('Property Staff');
        setIsCreateModalOpen(false);
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
                    
                    {/* Header Section */}
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                Manage user accounts, assign roles, and control system access.
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
                                                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                                    <button className="text-red-600 hover:text-red-900">Disable</button>
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
                                        </div>
                                        <div>
                                            <label htmlFor="staffRole" className="block mb-2 text-sm font-medium text-gray-900 font-sans">Assign Role</label>
                                            <select 
                                                id="staffRole" 
                                                value={newStaffRole}
                                                onChange={(e) => setNewStaffRole(e.target.value)}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-900 focus:border-red-900 block w-full p-2.5 font-sans" 
                                            >
                                                <option value="System Admin">System Admin</option>
                                                <option value="Property Staff">Property Staff</option>
                                                <option value="Internal Auditor">Internal Auditor</option>
                                                <option value="External Auditor">External Auditor</option>
                                            </select>
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
                                                className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                            >
                                                Add Staff
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}