import ApplicationLogo from '@/Components/ApplicationLogo';
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

    // Definition of the modules with Sub-menus
    const modules = getSidebarModules();

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="CNSC Supply & RIS Analytics Dashboard" />

            {/* --- SIDEBAR NAV --- */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                {/* Fixed Top Header */}
                <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-5 flex items-center justify-between">
                    <div>
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
                                    System Status: Operational & Tracking
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight tracking-tight text-white">
                                    Welcome back, {user.name.split(' ')[0]}
                                </h1>
                                <p className="text-red-100/90 text-lg md:text-xl font-medium leading-relaxed">
                                    You have <strong className="text-white">12 pending RIS requests</strong> and <strong className="text-white">3 critical stock alerts</strong> requiring your attention today.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                                <Link 
                                    href={route('inventory.index')} 
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all backdrop-blur-md"
                                >
                                    <span>Process RIS</span>
                                </Link>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Inventory Value', value: '₱1.24M', sub: 'Across 1,240 Items', trend: '+5.2%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: modules[0]?.icon || '📦' },
                            { label: 'Pending RIS', value: '12', sub: 'Requisition Slips', trend: 'Action Required', trendUp: false, color: 'text-yellow-600', bg: 'bg-yellow-50/50', icon: modules[1]?.icon || '📝' },
                            { label: 'Items Issued (MTD)', value: '840', sub: 'Successfully Released', trend: '+18%', trendUp: true, color: 'text-green-600', bg: 'bg-green-50/50', icon: modules[2]?.icon || '📤' },
                            { label: 'Critical Stock Alerts', value: '3', sub: 'Requires Reordering', trend: 'Urgent', trendUp: false, color: 'text-red-600', bg: 'bg-red-50/50', icon: modules[3]?.icon || '⚠️' },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} ring-1 ring-gray-900/5 group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.icon}
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${stat.trendUp ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">{stat.value}</h3>
                                    <p className="text-sm font-bold text-gray-700">{stat.label}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-1">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Complex Analytics & RIS Tracking Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Left: Data Analytics (Now with Custom Date Filter) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            <div className="px-8 py-7 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 font-serif">Movement Analytics</h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Stock In vs. RIS Issuances</p>
                                </div>
                                
                                {/* --- NEW CUSTOMIZABLE DATE FILTER --- */}
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <select 
                                        value={chartFilter}
                                        onChange={(e) => setChartFilter(e.target.value)}
                                        aria-label="Select time range" 
                                        className="w-full sm:w-auto text-sm border-gray-200 rounded-xl text-gray-700 shadow-sm focus:border-red-900 focus:ring-red-900 font-bold py-2.5 pl-4 pr-10 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <option value="monthly">Monthly View (Last 6 Mos)</option>
                                        <option value="yearly">Yearly View</option>
                                        <option value="custom">Custom Range...</option>
                                    </select>

                                    {/* Conditionally render date inputs if "Custom Range" is selected */}
                                    {chartFilter === 'custom' && (
                                        <div className="flex items-center gap-2 animate-[fadeIn_0.3s_ease-in-out]">
                                            <input 
                                                type="date" 
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full sm:w-auto text-sm border-gray-200 rounded-xl text-gray-700 shadow-sm focus:border-red-900 focus:ring-red-900 font-medium py-2.5 px-3"
                                                aria-label="Start Date"
                                            />
                                            <span className="text-gray-400 font-bold text-sm">to</span>
                                            <input 
                                                type="date" 
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full sm:w-auto text-sm border-gray-200 rounded-xl text-gray-700 shadow-sm focus:border-red-900 focus:ring-red-900 font-medium py-2.5 px-3"
                                                aria-label="End Date"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[350px] bg-gray-50/30">
                                {/* Chart Placeholder */}
                                <div className="w-full h-full flex items-end justify-between gap-4 px-4">
                                    {[40, 70, 45, 90, 65, 85].map((height, idx) => (
                                        <div key={idx} className="w-full flex flex-col justify-end items-center gap-3 group">
                                            <div className="flex w-full justify-center gap-1.5 h-56 items-end">
                                                <div className="w-1/3 bg-gray-200 rounded-t-lg group-hover:bg-gray-300 transition-colors" style={{ height: `${height}%` }}></div>
                                                <div className="w-1/3 bg-red-900/90 rounded-t-lg group-hover:bg-red-900 transition-colors" style={{ height: `${height * 0.7}%` }}></div>
                                                <div className="w-1/3 bg-yellow-400 rounded-t-lg group-hover:bg-yellow-500 transition-colors" style={{ height: `${height * 0.4}%` }}></div>
                                            </div>
                                            {/* Dynamic Label based on filter selection */}
                                            <span className="text-sm font-bold text-gray-400">
                                                {chartFilter === 'yearly' ? `202${idx}` : `M${idx + 1}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-8 mt-8">
                                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-gray-200"></div><span className="text-sm text-gray-600 font-bold">Starting Stock</span></div>
                                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-red-900/90"></div><span className="text-sm text-gray-600 font-bold">Stock In</span></div>
                                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span className="text-sm text-gray-600 font-bold">RIS Issued</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Active RIS Tracking Box */}
                        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-red-950 text-white">
                                <div>
                                    <h3 className="text-xl font-bold font-serif">Pending RIS</h3>
                                    <p className="text-sm text-red-200/80 font-medium mt-1">Awaiting action</p>
                                </div>
                                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                                    12 Total
                                </span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3 bg-gray-50/50">
                                {[
                                    { id: 'RIS-2026-089', dept: 'IT Department', items: '5x Laptops, 2x Monitors', status: 'Pending Approval', time: '2 hrs ago', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                    { id: 'RIS-2026-090', dept: 'Registrar Office', items: '20x Bond Paper (A4)', status: 'Ready for Release', time: '4 hrs ago', dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' },
                                    { id: 'RIS-2026-091', dept: 'HR Department', items: 'Office Chairs', status: 'Checking Stock', time: '1 day ago', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                                    { id: 'RIS-2026-092', dept: 'Science Lab', items: 'Microscope Bulbs', status: 'Pending Approval', time: '1 day ago', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                ].map((ris, i) => (
                                    <div key={i} className="p-5 bg-white border border-gray-100 hover:border-red-100 hover:shadow-md transition-all cursor-pointer rounded-2xl group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-gray-900 group-hover:text-red-900 transition-colors">{ris.id}</span>
                                            <span className="text-xs text-gray-400 font-semibold">{ris.time}</span>
                                        </div>
                                        <div className="text-sm font-bold text-gray-700 mb-1">{ris.dept}</div>
                                        <p className="text-sm font-medium text-gray-500 mb-4 truncate">{ris.items}</p>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${ris.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${ris.dot}`}></span>
                                            {ris.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 border-t border-gray-100 bg-white">
                                <button className="w-full py-3 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                    View All Documents
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">System Audit Trail</h3>
                                <p className="text-sm font-medium text-gray-500 mt-1">Real-time log of Inventory and RIS activities</p>
                            </div>
                            <button className="text-sm font-bold text-red-900 hover:text-white hover:bg-red-900 px-5 py-2.5 rounded-xl transition-colors border border-red-200 shadow-sm">
                                Download Report
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">User / Dept</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Action</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Reference</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Status</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-widest text-left text-gray-500 uppercase">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { user: 'Admin User', role: 'Property Custodian', action: 'Approved RIS Issuance', ref: 'RIS-2026-088', status: 'Completed', time: '10 mins ago', badge: 'bg-green-50 text-green-700 ring-1 ring-green-600/20' },
                                        { user: 'Staff Member', role: 'IT Department', action: 'Requested Supplies', ref: 'RIS-2026-089', status: 'Pending', time: '2 hours ago', badge: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' },
                                        { user: 'System', role: 'Automated', action: 'Stock Level Warning: Ink', ref: 'INV-ALERT', status: 'Critical', time: '5 hours ago', badge: 'bg-red-50 text-red-700 ring-1 ring-red-600/20' },
                                        { user: 'Supplier A', role: 'External', action: 'Delivered Purchase Order', ref: 'PO-2026-042', status: 'Received', time: '1 day ago', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-red-50 group-hover:text-red-900 transition-colors">
                                                        {row.user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{row.user}</div>
                                                        <div className="text-xs font-medium text-gray-500">{row.role}</div>
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