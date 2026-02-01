import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function ManageTransaction({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Filter States
    const [selectedModule, setSelectedModule] = useState<{ value: string; label: string } | null>(null);
    const [selectedAction, setSelectedAction] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Transaction');

    const moduleOptions = [
        { value: '', label: 'All Modules' },
        { value: 'Inventory', label: 'Inventory' },
        { value: 'Acquisition', label: 'Acquisition' },
        { value: 'Suppliers', label: 'Suppliers' },
        { value: 'User Role', label: 'User Role' },
    ];

    const actionOptions = [
        { value: '', label: 'All Actions' },
        { value: 'Create', label: 'Create' },
        { value: 'Update', label: 'Update' },
        { value: 'Delete', label: 'Delete' },
        { value: 'Stock In', label: 'Stock In' },
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
            <Head title="Audit Logs - Manage Transaction" />
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
                            <p className="text-sm text-gray-600 mt-1">Manage Transaction Trails</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h1 className="text-2xl font-bold mb-4">Transaction Trails</h1>
                                    <p className="text-sm text-gray-600 mb-6">Track and audit system transactions and activities.</p>

                                    {/* Search and Filter Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                                            <input 
                                                type="text" 
                                                placeholder="Transaction ID, User, or Details..." 
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Module</label>
                                            <Select
                                                options={moduleOptions}
                                                value={selectedModule}
                                                onChange={setSelectedModule}
                                                placeholder="All Modules"
                                                isClearable
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                                            <Select
                                                options={actionOptions}
                                                value={selectedAction}
                                                onChange={setSelectedAction}
                                                placeholder="All Actions"
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
                                                        Transaction ID
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Module
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Action
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Details
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Date & Time
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {[
                                                    { id: 'TRX-1001', user: 'John Doe', module: 'Inventory', action: 'Create', details: 'Added new item: Laptop', time: '2023-10-27 10:30:00' },
                                                    { id: 'TRX-1002', user: 'Mike Johnson', module: 'Acquisition', action: 'Update', details: 'Updated PO #12345 status', time: '2023-10-27 11:15:20' },
                                                    { id: 'TRX-1003', user: 'Sarah Williams', module: 'Suppliers', action: 'Delete', details: 'Removed supplier: XYZ Corp', time: '2023-10-26 09:45:10' },
                                                    { id: 'TRX-1004', user: 'Admin User', module: 'User Role', action: 'Update', details: 'Changed role for user ID 5', time: '2023-10-26 13:22:33' },
                                                    { id: 'TRX-1005', user: 'John Doe', module: 'Inventory', action: 'Stock In', details: 'Received 50 units of Mouse', time: '2023-10-25 15:10:05' },
                                                ].map((trx, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 font-mono">
                                                            {trx.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {trx.user}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {trx.module}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                                                            {trx.action}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {trx.details}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                            {trx.time}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                                        <div className="text-sm text-gray-500">
                                            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">200</span> results
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
