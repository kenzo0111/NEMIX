import SystemModeBadge from '@/Components/SystemModeBadge';
import { Head, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { Search, FileText, CheckCircle2, AlertTriangle, Layers, RotateCcw } from 'lucide-react';

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

const formatAuditTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) {
        const now = new Date();
        const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${datePart} • ${timePart}`;
    }

    if (typeof timestamp === 'string' && /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+•\s+\d{1,2}:\d{2}\s+(AM|PM)$/i.test(timestamp.trim())) {
        return timestamp.trim();
    }

    const date = parseAuditTimestamp(timestamp);
    if (!date) {
        return timestamp;
    }

    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart} • ${timePart}`;
};

const getDefaultTransactionLogs = () => {
    const now = new Date();
    const formatTime = (minutesAgo: number) => {
        const d = new Date(now.getTime() - minutesAgo * 60 * 1000);
        const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${datePart} • ${timePart}`;
    };

    return [
        { id: 'TRX-1001', user: 'Vince Balce', role: 'System Admin', action: 'Certified Unserviceable Assets', module: 'Inventory', details: 'Added 5 unserviceable desktop units to disposal list', status: 'Verified', time: formatTime(15) },
        { id: 'TRX-1002', user: 'Maria Santos', role: 'Internal Auditor', action: 'Generated Compliance Report', module: 'Compliance', details: 'Generated Annual Physical Inventory & Inspection Report for FY 2025', status: 'Logged', time: formatTime(60) },
        { id: 'TRX-1003', user: 'Juan Dela Cruz', role: 'Property Staff', action: 'Stock In Requisition', module: 'Inventory', details: 'Received 100 reams of A4 Copy Paper from Advance Paper Corp', status: 'Verified', time: formatTime(180) },
        { id: 'TRX-1004', user: 'Staff Member', role: 'Property Staff', action: 'Issued Inventory Stock', module: 'Inventory', details: 'Issued 20 units of Ballpen Black to SPMO Administrative Office', status: 'Flagged', time: formatTime(300) },
        { id: 'TRX-1005', user: 'System Admin', role: 'System Admin', action: 'Operating Mode Switched', module: 'System Configuration', details: 'Switched system operating mode from LIVE PRODUCTION to MAINTENANCE MODE', status: 'Verified', time: formatTime(1440) },
    ];
};

export default function ManageTransaction({ auth, logs: serverLogs = [] }: { auth: any, logs?: any[] }) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const [collapsed, setCollapsed] = useState(false);

    const rawLogs = useMemo(() => {
        return serverLogs && serverLogs.length > 0 ? serverLogs : getDefaultTransactionLogs();
    }, [serverLogs]);

    // --- 1. State for Filters ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState<{ value: string; label: string } | null>(null);
    const [selectedAction, setSelectedAction] = useState<{ value: string; label: string } | null>(null);

    const modules = getSidebarModules('Audit Logs', 'Manage Transaction');

    // --- 2. Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- 3. Statistics Calculation ---
    const stats = useMemo(() => {
        const total = rawLogs.length;
        const verified = rawLogs.filter(log => log.status === 'Verified' || log.status === 'Success' || log.status === 'Logged').length;
        const flagged = rawLogs.filter(log => log.status === 'Flagged' || log.status === 'Failed').length;
        const uniqueModules = new Set(rawLogs.map(log => log.module).filter(Boolean)).size;
        return { total, verified, flagged, uniqueModules };
    }, [rawLogs]);

    // --- 4. Filtering Logic ---
    const moduleOptions = useMemo(() => {
        const uniqueModules = Array.from(new Set(rawLogs.map(log => log.module).filter(Boolean))).sort();
        return uniqueModules.map(m => ({ value: m, label: m }));
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

        return uniqueActions.map(action => ({ value: normalizeActionKey(action), label: action }));
    }, [rawLogs]);

    const filteredLogs = useMemo(() => {
        return rawLogs.filter((log) => {
            const matchesSearch =
                (log.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.action || '').toLowerCase().includes(searchQuery.toLowerCase());

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

    const getAuditStatusClass = (status: string) => {
        switch (status) {
            case 'Verified':
            case 'Success':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
            case 'Logged':
                return 'bg-blue-50 text-blue-800 border-blue-200/80';
            case 'Flagged':
            case 'Failed':
                return 'bg-amber-50 text-amber-800 border-amber-200/80';
            case 'In Progress':
                return 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Audit Logs - Manage Transaction" />

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
                                <Breadcrumbs items={[{ name: 'Audit Logs' }, { name: 'Manage Transaction' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Audit Logs</h2>
                            <p className="text-xs text-gray-500 font-medium">Transaction trails and activity log for administrative review</p>
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
                                    <FileText className="w-4 h-4 text-red-900" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-red-50 text-red-800 border border-red-200">
                                    AUDITED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.total}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Total Transaction Logs</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">All Monitored Actions</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    VERIFIED
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.verified}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Verified Actions</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Approved System Operations</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                                    <AlertTriangle className="w-4 h-4 text-amber-800" />
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${stats.flagged > 0 ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                    {stats.flagged > 0 ? 'ATTENTION' : 'NORMAL'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.flagged}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Flagged Entries</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Exceptions & Warnings</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <Layers className="w-4 h-4 text-blue-800" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-50 text-blue-800 border border-blue-200">
                                    MODULES
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{stats.uniqueModules}</h3>
                                <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">Monitored Modules</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">System Operational Areas</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Audit Ledger Container */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-100/90">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">System Transaction Audit Ledger</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-red-100 text-red-900 rounded-full border border-red-200">
                                        {filteredLogs.length} {filteredLogs.length === 1 ? 'Entry' : 'Entries'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">Chronological record of system transactions, administrative changes, and user activities</p>
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by ID, User, or Details..."
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
                                        options={moduleOptions}
                                        value={selectedModule}
                                        onChange={setSelectedModule}
                                        placeholder="Filter by Module"
                                        isClearable
                                        styles={selectStyles}
                                    />
                                </div>

                                <div className="w-44">
                                    <Select
                                        options={actionOptions}
                                        value={selectedAction}
                                        onChange={setSelectedAction}
                                        placeholder="Filter by Action"
                                        isClearable
                                        styles={selectStyles}
                                    />
                                </div>

                                {(searchQuery || selectedModule || selectedAction) && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedModule(null); setSelectedAction(null); }}
                                        className="px-2.5 py-1.5 text-xs font-bold text-red-900 hover:text-red-950 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors inline-flex items-center gap-1"
                                        title="Reset all transaction log filters"
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
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/4">Authorized User</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/3">Action Performed</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Module</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Audit Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold tracking-wider text-gray-800 uppercase w-1/6">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs">
                                    {paginatedLogs.length > 0 ? (
                                        paginatedLogs.map((trx, index) => (
                                            <tr key={trx.id || index} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-red-900/10 text-red-950 font-bold flex items-center justify-center text-xs shrink-0 border border-red-900/20">
                                                            {(trx.user || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 group-hover:text-red-900 transition-colors">{trx.user}</span>
                                                            <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">{trx.role || 'User'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-xs tracking-tight">{toTitleCase(trx.action) || 'System Operation'}</div>
                                                    {trx.details && (
                                                        <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">{trx.details}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 font-mono">
                                                        {trx.module || 'System'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getAuditStatusClass(trx.status || 'Unknown')}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        {trx.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-mono font-semibold">
                                                    {formatAuditTimestamp(trx.time)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="w-8 h-8 text-gray-300" />
                                                    <p className="font-medium text-gray-600">No transactions match your filter criteria.</p>
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setSelectedModule(null); setSelectedAction(null); }}
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
                                Showing <span className="font-bold text-gray-700">{paginatedLogs.length}</span> of <span className="font-bold text-gray-700">{filteredLogs.length}</span> filtered transaction records
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