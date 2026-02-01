import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function ManageLoginTrails({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Filter States
    const [selectedRole, setSelectedRole] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Login Trails');

    const roleOptions = [
        { value: '', label: 'All Roles' },
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Auditor', label: 'Auditor' },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'Success', label: 'Success' },
        { value: 'Failed', label: 'Failed' },
    ];

    // Select Styles
    const selectStyles = {
        control: (provided: any) => ({
            ...provided,
            borderColor: '#d1d5db',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '&:hover': {
                borderColor: '#dc2626',
            },
            '&:focus-within': {
                borderColor: '#dc2626',
                boxShadow: '0 0 0 1px #dc2626',
            },
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#6b7280',
            fontSize: '0.875rem',
        }),
        singleValue: (provided: any) => ({
            ...provided,
            fontSize: '0.875rem',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
            color: state.isSelected ? 'white' : '#374151',
        }),
    };

    return (
        <>
            <Head title="Audit Logs - Manage Login Trails" />
            <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                    {/* Header */}
                    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                        <div>
                            <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Audit Logs</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage Login Trails</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h1 className="text-2xl font-bold mb-4">Login Trails</h1>
                                    <p className="text-sm text-gray-600 mb-6">Monitor users' login activities and access logs.</p>
                                    
                                    {/* Search and Filter Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                                            <input 
                                                type="text" 
                                                placeholder="User Name, Email, or IP..." 
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                            <Select
                                                options={roleOptions}
                                                value={selectedRole}
                                                onChange={setSelectedRole}
                                                placeholder="All Roles"
                                                isClearable
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                            <Select
                                                options={statusOptions}
                                                value={selectedStatus}
                                                onChange={setSelectedStatus}
                                                placeholder="All Statuses"
                                                isClearable
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={selectStyles}
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        User Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Login Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        IP Address
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {[
                                                    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', time: '2023-10-27 08:30:12', ip: '192.168.1.1', status: 'Success' },
                                                    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', time: '2023-10-27 09:15:45', ip: '192.168.1.5', status: 'Failed' },
                                                    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', time: '2023-10-27 10:20:01', ip: '192.168.1.10', status: 'Success' },
                                                    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'User', time: '2023-10-26 14:45:23', ip: '192.168.1.8', status: 'Success' },
                                                    { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Auditor', time: '2023-10-26 16:12:11', ip: '192.168.1.15', status: 'Success' },
                                                ].map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                            {log.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {log.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {log.role}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                            {log.time}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                            {log.ip}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                                        <div className="text-sm text-gray-500">
                                            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">50</span> results
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Previous</button>
                                            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Next</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}