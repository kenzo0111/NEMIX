import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react'; // Added useMemo for performance
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function ManageLoginTrails({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Login Trails');

    // Sample Data
    const loginData = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', time: '2023-10-27 08:30:12', ip: '192.168.1.1', status: 'Success' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', time: '2023-10-27 09:15:45', ip: '192.168.1.5', status: 'Failed' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', time: '2023-10-27 10:20:01', ip: '192.168.1.10', status: 'Success' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'User', time: '2023-10-26 14:45:23', ip: '192.168.1.8', status: 'Success' },
        { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Auditor', time: '2023-10-26 16:12:11', ip: '192.168.1.15', status: 'Success' },
    ];

    // --- FILTER LOGIC ---
    const filteredData = useMemo(() => {
        return loginData.filter((log) => {
            const matchesSearch = 
                log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.ip.includes(searchQuery);

            const matchesRole = selectedRole ? log.role === selectedRole.value : true;
            const matchesStatus = selectedStatus ? log.status === selectedStatus.value : true;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [searchQuery, selectedRole, selectedStatus]);

    const roleOptions = [
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Auditor', label: 'Auditor' },
    ];

    const statusOptions = [
        { value: 'Success', label: 'Success' },
        { value: 'Failed', label: 'Failed' },
    ];

    const selectStyles = {
        control: (provided: any) => ({
            ...provided,
            minHeight: '38px',
            borderRadius: '0.5rem',
            borderColor: '#e5e7eb',
            boxShadow: 'none',
            '&:hover': { borderColor: '#dc2626' },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            fontSize: '0.875rem',
        }),
    };

    return (
        <>
            <Head title="Audit Logs - Manage Login Trails" />
            <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-gray-900">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                    <div className="bg-white border-b border-gray-200 px-8 py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Login Trails</h2>
                                <p className="text-sm text-gray-500">Security auditing and session monitoring</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            
                            {/* Functional Filter Toolbar */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[280px]">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Search Activity</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Name, email, or IP address..." 
                                            className="w-full pl-4 pr-10 py-2 bg-gray-50 border-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute inset-y-0 right-10 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                ×
                                            </button>
                                        )}
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-48">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Role</label>
                                    <Select options={roleOptions} value={selectedRole} onChange={setSelectedRole} placeholder="Select Role" isClearable styles={selectStyles} />
                                </div>

                                <div className="w-48">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Status</label>
                                    <Select options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} placeholder="Select Status" isClearable styles={selectStyles} />
                                </div>

                                <button 
                                    onClick={() => {setSearchQuery(''); setSelectedRole(null); setSelectedStatus(null);}}
                                    className="text-xs text-red-600 font-semibold hover:underline mb-3 ml-2"
                                >
                                    Reset Filters
                                </button>
                            </div>

                            {/* Data Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">User Details</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Access Role</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">IP Address</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredData.length > 0 ? (
                                                filteredData.map((log) => (
                                                    <tr key={log.id} className="hover:bg-red-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-900 group-hover:text-red-900">{log.name}</span>
                                                                <span className="text-xs text-gray-500">{log.email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                                                {log.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                            {log.time}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                            {log.ip}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                                                                log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                        No login trails found matching your filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        Showing <span className="font-bold text-gray-700">{filteredData.length}</span> results
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}