import { Head, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { Search, Shield, CheckCircle, AlertTriangle, Users, Key, RotateCcw } from 'lucide-react';

export default function ManageLoginTrails({ auth, loginData: serverLoginData = [] }: { auth: any, loginData?: any[] }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);

    // Default Fallback Data if server data is empty
    const defaultLoginLogs = [
        { id: 'LOG-1001', name: 'Vince Balce', email: 'vince.balce@ucn.edu.ph', role: 'Admin', time: '2026-08-15 08:30:12', ip: '192.168.1.105', status: 'Success' },
        { id: 'LOG-1002', name: 'Maria Santos', email: 'maria.santos@ucn.edu.ph', role: 'Auditor', time: '2026-08-15 09:14:45', ip: '192.168.1.112', status: 'Success' },
        { id: 'LOG-1003', name: 'Unknown User', email: 'guest.attempt@external.com', role: 'User', time: '2026-08-15 09:42:01', ip: '110.54.221.89', status: 'Failed' },
        { id: 'LOG-1004', name: 'Juan Dela Cruz', email: 'juan.delacruz@ucn.edu.ph', role: 'Manager', time: '2026-08-15 10:05:30', ip: '192.168.1.140', status: 'Success' },
        { id: 'LOG-1005', name: 'Property Staff', email: 'property.staff@ucn.edu.ph', role: 'User', time: '2026-08-15 11:20:18', ip: '192.168.1.118', status: 'Success' },
        { id: 'LOG-1006', name: 'Admin User', email: 'admin.sec@ucn.edu.ph', role: 'Admin', time: '2026-08-15 13:02:55', ip: '192.168.1.101', status: 'Failed' },
    ];

    const loginData = serverLoginData.length > 0 ? serverLoginData : defaultLoginLogs;

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const modules = getSidebarModules('Audit Logs', 'Manage Login Trails');

    // --- Stats Summary ---
    const stats = useMemo(() => {
        const total = loginData.length;
        const success = loginData.filter(log => log.status === 'Success').length;
        const failed = loginData.filter(log => log.status === 'Failed').length;
        const uniqueUsers = new Set(loginData.map(log => log.email || log.name)).size;
        return { total, success, failed, uniqueUsers };
    }, [loginData]);

    // --- Dynamic Options ---
    const roleOptions = useMemo(() => {
        const roles = Array.from(new Set(loginData.map(l => l.role).filter(Boolean)));
        return roles.map(r => ({ value: r, label: r }));
    }, [loginData]);

    const statusOptions = [
        { value: 'Success', label: 'Success' },
        { value: 'Failed', label: 'Failed' },
    ];

    // --- FILTER LOGIC ---
    const filteredData = useMemo(() => {
        return loginData.filter((log) => {
            const nameSearch = (log.name || '').toLowerCase();
            const emailSearch = (log.email || '').toLowerCase();
            const ipSearch = (log.ip || '').toLowerCase();
            const query = (searchQuery || '').toLowerCase();

            const matchesSearch =
                nameSearch.includes(query) ||
                emailSearch.includes(query) ||
                ipSearch.includes(query);

            const matchesRole = selectedRole ? log.role === selectedRole.value : true;
            const matchesStatus = selectedStatus ? log.status === selectedStatus.value : true;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [loginData, searchQuery, selectedRole, selectedStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, selectedStatus]);

    const selectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
            borderWidth: '1px',
            padding: '1px 2px',
            minWidth: '160px',
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
        singleValue: (provided: any) => ({
            ...provided,
            color: '#111827',
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Audit Logs - Manage Login Trails" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Top Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">University Enterprise Administrative System</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <span>SYSTEM MODE: LIVE PRODUCTION</span>
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'Audit Logs' }, { name: 'Manage Login Trails' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Login Trails</h2>
                            <p className="text-xs text-gray-500 font-medium">Security auditing and real-time session tracking</p>
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
                    {/* Quick Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-red-50 border border-gray-200">
                                    <Key className="w-4 h-4 text-red-900" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-red-50 text-red-800 border border-red-200">
                                    MONITORED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.total}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Total Login Sessions</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">All Recorded Attempts</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                    <CheckCircle className="w-4 h-4 text-emerald-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    VERIFIED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.success}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Successful Logins</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Authorized Access Granted</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                                    <AlertTriangle className="w-4 h-4 text-amber-800" />
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${stats.failed > 0 ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                    {stats.failed > 0 ? 'SECURITY ALERT' : 'NORMAL'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.failed}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Failed Login Attempts</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Denied / Invalid Credentials</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <Users className="w-4 h-4 text-blue-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-50 text-blue-800 border border-blue-200">
                                    ACTIVE USERS
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.uniqueUsers}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Unique User Accounts</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Distinct User Identities</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Audit Ledger Container */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">System Login Audit Ledger</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-red-100 text-red-900 rounded-full border border-red-200">
                                        {filteredData.length} {filteredData.length === 1 ? 'Entry' : 'Entries'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Chronological authentication logs, IP locations, and authorization status</p>
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Name, email, or IP address..."
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

                                <div className="w-44">
                                    <Select
                                        options={roleOptions}
                                        value={selectedRole}
                                        onChange={setSelectedRole}
                                        placeholder="Filter by Role"
                                        isClearable
                                        styles={selectStyles}
                                    />
                                </div>

                                <div className="w-44">
                                    <Select
                                        options={statusOptions}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        placeholder="Filter by Status"
                                        isClearable
                                        styles={selectStyles}
                                    />
                                </div>

                                {(searchQuery || selectedRole || selectedStatus) && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedRole(null); setSelectedStatus(null); }}
                                        className="px-2.5 py-1.5 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors inline-flex items-center gap-1"
                                        title="Reset filters"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-x-auto flex-1 flex flex-col justify-between min-w-full">
                            <table className="w-full text-left border-collapse flex-1 min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-300 bg-gray-200/60 font-serif">
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/3">User Details</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Access Role</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/5">Timestamp</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">IP Address</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase text-center w-1/6">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((log, index) => (
                                            <tr key={log.id || index} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-red-900/10 text-red-950 font-bold flex items-center justify-center text-xs shrink-0 border border-red-900/20">
                                                            {(log.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 group-hover:text-red-900 transition-colors">{log.name}</span>
                                                            <span className="text-[11px] text-gray-500 font-mono">{log.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 font-mono">
                                                        {log.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-mono font-semibold">
                                                    {log.time}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded inline-block">
                                                        {log.ip}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${log.status === 'Success'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                                        : 'bg-red-50 text-red-800 border-red-200/80'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Shield className="w-8 h-8 text-gray-300" />
                                                    <p className="font-medium text-gray-600">No login trails match your filter criteria.</p>
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setSelectedRole(null); setSelectedStatus(null); }}
                                                        className="text-xs font-bold text-red-900 hover:underline"
                                                    >
                                                        Reset all filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination & Summary Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-700">{paginatedData.length}</span> of <span className="font-bold text-gray-700">{filteredData.length}</span> login records
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-600 font-medium px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}