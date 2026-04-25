import { Head, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { useState, useMemo, useEffect } from 'react'; // Added useMemo
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { Search, Filter, ArrowRight, Download, Activity, User, Box } from 'lucide-react';

const toTitleCase = (value?: string | null) => {
    if (!value) {
        return '';
    }

    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase());
};

const normalizeActionKey = (value?: string | null) => {
    return toTitleCase(value).toLowerCase();
};

const parseAuditTimestamp = (timestamp?: string | null) => {
    if (!timestamp) {
        return null;
    }

    const normalized = timestamp.replace('•', ' ').trim();
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRelativeTime = (timestamp: string | null | undefined, now: Date) => {
    const date = parseAuditTimestamp(timestamp);
    if (!date) {
        return timestamp || 'Unknown time';
    }

    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const absSeconds = Math.abs(diffSeconds);

    if (absSeconds < 10) {
        return 'Just now';
    }

    if (absSeconds < 60) {
        return `${absSeconds} sec${absSeconds === 1 ? '' : 's'} ago`;
    }

    const diffMinutes = Math.floor(absSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.floor(absSeconds / 3600);
    if (diffHours < 24) {
        return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    }

    const diffDays = Math.floor(absSeconds / 86400);
    if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export default function ManageTransaction({ auth, logs }: { auth: any, logs?: any[] }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // --- 1. State for Filters ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState<{ value: string; label: string } | null>(null);
    const [selectedAction, setSelectedAction] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Transaction');

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    // Raw Data coming from props
    const rawLogs = logs || [];
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- 2. Filtering Logic ---
    const moduleOptions = useMemo(() => {
        const uniqueModules = Array.from(new Set(rawLogs.map(log => log.module).filter(Boolean))).sort();
        return [
            { value: '', label: 'All Modules' },
            ...uniqueModules.map(m => ({ value: m, label: m }))
        ];
    }, [rawLogs]);

    const actionOptions = useMemo(() => {
        const uniqueActions: string[] = Array.from(
            rawLogs.reduce((map: Map<string, string>, log) => {
                const action = toTitleCase(log.action);

                if (action) {
                    map.set(normalizeActionKey(log.action), action);
                }

                return map;
            }, new Map<string, string>()).values()
        ).sort();

        return [
            { value: '', label: 'All Actions' },
            ...uniqueActions.map(action => ({ value: normalizeActionKey(action), label: action }))
        ];
    }, [rawLogs]);

    const filteredLogs = useMemo(() => {
        return rawLogs.filter((log) => {
            const matchesSearch = 
                log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesModule = !selectedModule?.value || log.module === selectedModule.value;
            const matchesAction = !selectedAction?.value || normalizeActionKey(log.action) === selectedAction.value;

            return matchesSearch && matchesModule && matchesAction;
        });
    }, [searchQuery, selectedModule, selectedAction, rawLogs]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedModule, selectedAction, rawLogs]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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
                            
                                <div className="mb-2">
                                    <Breadcrumbs items={[{name:'Audit Logs'},{name:'Manage Transaction'}]} />
                                </div>
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
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header similar to Dashboard */}
                            <div className="px-8 py-7 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif">Manage Transaction</h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Verified activity log for administrative and oversight review</p>
                                </div>
                            </div>
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
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Authorized User</th>
                                            <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Action Performed</th>
                                            <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Resource Ref</th>
                                            <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Audit Status</th>
                                            <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedLogs.length > 0 ? (
                                            paginatedLogs.map((trx, index) => (
                                                <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-red-50 group-hover:text-red-900 transition-colors">
                                                                {trx.user.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900">{trx.user}</div>
                                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{trx.role}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-700">{toTitleCase(trx.action) || 'Unknown Action'}</div>
                                                        <div className="text-xs text-gray-500">{trx.details}</div>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                                                            {trx.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${trx.badge}`}>
                                                            {trx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-semibold">{formatRelativeTime(trx.time, now)}</td>
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

                            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs text-gray-500">Showing {paginatedLogs.length} of {filteredLogs.length} filtered records</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}