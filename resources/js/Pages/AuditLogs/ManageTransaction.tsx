import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react'; // Added useMemo
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { Search, Filter, ArrowRight, Download, Activity, User, Box } from 'lucide-react';

export default function ManageTransaction({ auth }: { auth: any }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // --- 1. State for Filters ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState<{ value: string; label: string } | null>(null);
    const [selectedAction, setSelectedAction] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Transaction');

    // Raw Data (Usually this comes from props.logs)
    const rawLogs = [
        { id: 'TRX-1001', user: 'John Doe', module: 'Inventory', action: 'Create', details: 'Added new item: Laptop', time: 'Oct 27, 2023 • 10:30 AM' },
        { id: 'TRX-1002', user: 'Mike Johnson', module: 'Acquisition', action: 'Update', details: 'Updated PO #12345 status', time: 'Oct 27, 2023 • 11:15 AM' },
        { id: 'TRX-1003', user: 'Sarah Williams', module: 'Suppliers', action: 'Delete', details: 'Removed supplier: XYZ Corp', time: 'Oct 26, 2023 • 09:45 AM' },
        { id: 'TRX-1004', user: 'Admin User', module: 'User Role', action: 'Update', details: 'Changed role for user ID 5', time: 'Oct 26, 2023 • 01:22 PM' },
        { id: 'TRX-1005', user: 'John Doe', module: 'Inventory', action: 'Stock In', details: 'Received 50 units of Mouse', time: 'Oct 25, 2023 • 03:10 PM' },
    ];

    // --- 2. Filtering Logic ---
    const filteredLogs = useMemo(() => {
        return rawLogs.filter((log) => {
            const matchesSearch = 
                log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesModule = !selectedModule?.value || log.module === selectedModule.value;
            const matchesAction = !selectedAction?.value || log.action === selectedAction.value;

            return matchesSearch && matchesModule && matchesAction;
        });
    }, [searchQuery, selectedModule, selectedAction]);

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

    const selectStyles = {
        control: (provided: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            padding: '2px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#dc2626' },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fff1f1' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            padding: '10px 12px',
        }),
    };

    return (
        <>
            <Head title="Audit Logs - Manage Transaction" />
            <div className="min-h-screen bg-[#fcfcfc] flex font-sans text-gray-900">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-10 py-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Audit Logs</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span>Manage Transaction Trails</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <span className="text-red-700 font-medium">{filteredLogs.length} results found</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Filter Bar */}
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[300px]">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Search Activity</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)} // Updated
                                            placeholder="Search by ID, User, or Details..." 
                                            className="w-full pl-10 pr-4 py-2 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="w-48">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Module</label>
                                    <Select 
                                        options={moduleOptions} 
                                        value={selectedModule} 
                                        onChange={setSelectedModule} 
                                        styles={selectStyles} 
                                        placeholder="All" 
                                        isClearable
                                    />
                                </div>
                                <div className="w-48">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Action Type</label>
                                    <Select 
                                        options={actionOptions} 
                                        value={selectedAction} 
                                        onChange={setSelectedAction} 
                                        styles={selectStyles} 
                                        placeholder="All" 
                                        isClearable
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-100">
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Module & Action</th>
                                            <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((trx, index) => (
                                                <tr key={index} className="hover:bg-red-50/30 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-700 font-mono group-hover:text-red-700 transition-colors">
                                                        {trx.id}
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                                                                {trx.user.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">{trx.user}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">{trx.module}</span>
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md w-fit ${
                                                                trx.action === 'Delete' ? 'bg-red-100 text-red-700' : 
                                                                trx.action === 'Create' ? 'bg-green-100 text-green-700' : 
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {trx.action}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-sm text-gray-600 leading-relaxed max-w-xs">{trx.details}</p>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-medium">
                                                        {trx.time}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search size={40} className="text-gray-200" />
                                                        <p className="text-gray-500 font-medium">No transactions match your filters.</p>
                                                        <button 
                                                            onClick={() => {setSearchQuery(''); setSelectedModule(null); setSelectedAction(null);}}
                                                            className="text-red-600 text-sm font-bold hover:underline"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}