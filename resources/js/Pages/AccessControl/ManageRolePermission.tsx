import { Head } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react'; // Optional: for icons
import Sidebar from '@/Components/Sidebar';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useState } from 'react';

export default function ManageRolePermission({ auth }: { auth: any }) {
    const user = auth?.user;
    const [collapsed, setCollapsed] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<{id: number, name: string} | null>(null);
    const modules = getSidebarModules('Access', 'Manage Role Permission');

    // Mock data - replace with props from Inertia
    const [roles, setRoles] = useState([
        { id: 1, name: 'System Admin', permissions_count: 45 },
        { id: 2, name: 'Property Staff', permissions_count: 28 },
        { id: 3, name: 'Internal Auditor', permissions_count: 15 },
        { id: 4, name: 'External Auditor', permissions_count: 10 },
    ]);

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        // Add to mock data - replace with actual Inertia post request
        setRoles([...roles, {
            id: roles.length ? Math.max(...roles.map(r => r.id)) + 1 : 1,
            name: newRoleName,
            permissions_count: 0
        }]);
        setNewRoleName('');
        setIsCreateModalOpen(false);
    };

    const handleEditClick = (role: any) => {
        setEditingRole(role);
        setIsEditModalOpen(true);
    };

    const handleUpdateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole || !editingRole.name.trim()) return;
        setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: editingRole.name } : r));
        setIsEditModalOpen(false);
        setEditingRole(null);
    };

    const handleDeleteRole = (id: number) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            setRoles(roles.filter(r => r.id !== id));
        }
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
                            onClick={() => setIsCreateModalOpen(true)}
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
                                                    <button onClick={() => handleEditClick(role)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                                    <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900">Delete</button>
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
                                                className="text-white bg-red-900 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                            >
                                                Create Role
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
                        <div className="relative w-full max-w-md p-4 mx-auto">
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-xl">
                                    <h3 className="text-xl font-bold text-red-950 font-serif">Edit Role</h3>
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
                                    <form onSubmit={handleUpdateRole}>
                                        <div>
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
                                        <div className="flex items-center justify-end mt-6 space-x-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsEditModalOpen(false)}
                                                className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50 focus:z-10"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                            >
                                                Update Role
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