import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function Dashboard({ auth }: { auth: any }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // State for the Movement Analytics Filter
    const [chartFilter, setChartFilter] = useState('monthly');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const modules = getSidebarModules();

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="CNSC Supply & Asset Analytics Dashboard" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-5 flex items-center justify-between">
                    <div>
                        <div className="mb-2">
                            <Breadcrumbs items={[]} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Supply & Analytics</h2>
                    </div>
                    <div className="flex items-center gap-6">
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

                <div className="p-8 space-y-10 max-w-[1600px] mx-auto pb-20">
                    
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-950 to-red-900 text-white shadow-lg border border-red-800/50">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 px-10 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-red-950/50 border border-red-700/50 text-xs font-bold text-yellow-300 mb-6 backdrop-blur-md shadow-inner">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    System Status: Operational & Secure
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight tracking-tight text-white">
                                    Welcome back, {user.name.split(' ')[0]}
                                </h1>
                                <p className="text-red-100/90 text-lg md:text-xl font-medium leading-relaxed">
                                    The system is currently tracking <strong className="text-white">1,240 active inventory items</strong> with real-time stock monitoring.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                                <Link 
                                    href={route('inventory.index')} 
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-950 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-yellow-50 transition-all shadow-md hover:shadow-lg"
                                >
                                    <span>Inventory Analytics</span>
                                    <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
                        {[
                            { label: 'Total Inventory Value', value: '₱1.24M', sub: 'Across 1,240 Items', trend: '+5.2%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: '📦' },
                            { label: 'Total RIS Issued', value: '1,420', sub: 'Completed Requests', trend: 'Lifetime', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: '📜' },
                            { label: 'Items Issued (MTD)', value: '840', sub: 'Current Month', trend: '+18%', trendUp: true, color: 'text-green-600', bg: 'bg-green-50/50', icon: '📤' },
                            { label: 'Unserviceable', value: '24', sub: 'Ready for Disposal', trend: 'High Volume', trendUp: false, color: 'text-orange-600', bg: 'bg-orange-50/50', icon: '♻️' },
                            { label: 'Critical Stock Alerts', value: '3', sub: 'Requires Reordering', trend: 'Urgent', trendUp: false, color: 'text-red-600', bg: 'bg-red-50/50', icon: '⚠️' },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} ring-1 ring-gray-900/5 group-hover:scale-110 transition-transform duration-300 text-xl`}>
                                        {stat.icon}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stat.trendUp ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-0.5">{stat.value}</h3>
                                    <p className="text-sm font-bold text-gray-700 truncate">{stat.label}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Movement Analytics Section */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Movement Analytics</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Stock In vs. RIS Issuances</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <select 
                                    aria-label="Movement analytics filter"
                                    value={chartFilter}
                                    onChange={(e) => setChartFilter(e.target.value)}
                                    className="w-full sm:w-auto text-sm border-gray-200 rounded-xl text-gray-700 shadow-sm focus:border-red-900 focus:ring-red-900 font-bold py-2.5 pl-4 pr-10 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <option value="monthly">Monthly View (Last 6 Mos)</option>
                                    <option value="yearly">Yearly View</option>
                                    <option value="custom">Custom Range...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[400px] bg-gray-50/30">
                            <div className="w-full h-full flex items-end justify-between gap-6 px-4 max-w-6xl mx-auto">
                                {[40, 70, 45, 90, 65, 85, 55, 75].map((height, idx) => (
                                    <div key={idx} className="w-full flex flex-col justify-end items-center gap-3 group">
                                        <div className="flex w-full justify-center gap-2 h-64 items-end">
                                            <div className="w-1/4 bg-gray-200 rounded-t-lg group-hover:bg-gray-300 transition-colors" style={{ height: `${height}%` }}></div>
                                            <div className="w-1/4 bg-red-900/90 rounded-t-lg group-hover:bg-red-900 transition-colors" style={{ height: `${height * 0.7}%` }}></div>
                                            <div className="w-1/4 bg-yellow-400 rounded-t-lg group-hover:bg-yellow-500 transition-colors" style={{ height: `${height * 0.4}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-400">
                                            {chartFilter === 'yearly' ? `202${idx}` : `M${idx + 1}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-10 mt-10">
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div><span className="text-sm text-gray-600 font-bold">Starting Stock</span></div>
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-red-900/90"></div><span className="text-sm text-gray-600 font-bold">Stock In</span></div>
                                <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full bg-yellow-400"></div><span className="text-sm text-gray-600 font-bold">RIS Issued</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock & Reorder Alerts - Bento Style */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Reorder Monitoring</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Items currently below minimum safety stock levels</p>
                            </div>
                            <Link 
                                href={route('inventory.index')} // Or a specific filtered route
                                className="text-sm font-bold text-red-900 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-colors"
                            >
                                View All Alerts
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            {[
                                { name: 'A4 Copier Paper (80gsm)', sku: 'SUP-PAP-001', current: 12, min: 50, unit: 'Reams', priority: 'Critical' },
                                { name: 'HP Laser Jet Toner 85A', sku: 'SUP-TON-085', current: 2, min: 10, unit: 'Units', priority: 'Critical' },
                                { name: 'Ballpoint Pen (Black)', sku: 'SUP-PEN-002', current: 45, min: 100, unit: 'Pieces', priority: 'Warning' },
                            ].map((item, i) => (
                                <div key={i} className="p-8 hover:bg-gray-50/50 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                                                item.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {item.priority}
                                            </span>
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{item.sku}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-3xl font-black text-gray-900">{item.current}</span>
                                                <span className="text-sm font-bold text-gray-500 ml-1.5">/ {item.min} {item.unit}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-red-600">-{((item.min - item.current) / item.min * 100).toFixed(0)}% Deficit</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    item.priority === 'Critical' ? 'bg-red-600' : 'bg-orange-500'
                                                }`}
                                                style={{ width: `${(item.current / item.min) * 100}%` }}
                                            ></div>
                                        </div>

                                        <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-900 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                                            </svg>
                                            Generate Purchase Request
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refined System Audit Trail for Admins, Staff, and Auditors */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Compliance & Audit Trail</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Verified activity log for administrative and oversight review</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="text-sm font-bold text-gray-600 hover:bg-gray-100 px-5 py-2.5 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                    Filter by Role
                                </button>
                                <button className="text-sm font-bold text-red-900 hover:text-white hover:bg-red-900 px-5 py-2.5 rounded-xl transition-colors border border-red-200 shadow-sm">
                                    Export Audit Log
                                </button>
                            </div>
                        </div>
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
                                    {[
                                        { user: 'Vince Balce', role: 'System Admin', action: 'Certified Unserviceable Assets', ref: 'CERT-2026-004', status: 'Verified', time: '15 mins ago', badge: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
                                        { user: 'Maria Santos', role: 'Internal Auditor', action: 'Exported Annual Supply Report', ref: 'RPT-ANN-2026', status: 'Logged', time: '1 hour ago', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' },
                                        { user: 'Staff Member', role: 'Property Staff', action: 'Overrode Stock Level Warning', ref: 'INV-OVR-882', status: 'Flagged', time: '3 hours ago', badge: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' },
                                        { user: 'System Auditor', role: 'External Auditor', action: 'Initiated Inventory Reconciliation', ref: 'AUD-REC-01', status: 'In Progress', time: '5 hours ago', badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' },
                                        { user: 'Admin User', role: 'System Admin', action: 'Updated Asset Category Schema', ref: 'SYS-CONF-DEPT', status: 'Verified', time: '1 day ago', badge: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-red-50 group-hover:text-red-900 transition-colors">
                                                        {row.user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{row.user}</div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{row.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-700">{row.action}</td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                                                    {row.ref}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${row.badge}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-semibold">{row.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}