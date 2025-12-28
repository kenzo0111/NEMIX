import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function Dashboard({ auth }: { auth: any }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Track which parent menu is currently open
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    const toggleSubmenu = (title: string) => {
        // If sidebar is collapsed, expand it to show the submenu
        if (collapsed) {
            setCollapsed(false);
            setExpandedModule(title);
        } else {
            // Toggle: Close if open, Open if closed
            setExpandedModule(expandedModule === title ? null : title);
        }
    };

    // Definition of the modules with Sub-menus
    const modules = getSidebarModules();

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="CNSC Supply Management Dashboard" />

            {/* --- SIDEBAR NAV --- */}
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-red-900 to-red-950 border-r border-red-800 
                    text-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col
                    ${collapsed ? 'w-20' : 'w-72'}
                `}
            >
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
                
                {/* Branding Section */}
                <div className={`p-6 flex items-center border-b border-red-800/50 relative z-10 transition-all h-[88px] ${collapsed ? 'justify-center' : 'justify-start gap-4'}`}>
                    {/* LOGO RESTORED HERE */}
                    <div className="bg-white p-1.5 rounded-full shadow-lg border-2 border-yellow-500 shrink-0">
                        <img src="/images/cnscrefine.png" className="w-8 h-8" alt="CNSC Logo" />
                    </div>
                    
                    {!collapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h1 className="font-bold tracking-wider text-base">CNSC SPMO</h1>
                            <p className="text-[10px] text-yellow-400 uppercase tracking-widest leading-none">Supply Management</p>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 relative z-10 scrollbar-hide">
                    {!collapsed && (
                        <p className="px-3 text-[10px] font-bold text-red-200/40 uppercase tracking-widest mb-2 transition-opacity duration-300">
                            Main Modules
                        </p>
                    )}
                    
                    {modules.map((item, index) => {
                        const hasSubmodules = item.submodules && item.submodules.length > 0;
                        const isExpanded = expandedModule === item.title;

                        return (
                            <div key={index}>
                                {/* Parent Menu Item */}
                                <button
                                    onClick={() => hasSubmodules ? toggleSubmenu(item.title) : null}
                                    title={collapsed ? `${item.title} ${item.subtitle}` : ''}
                                    className={`
                                        w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 
                                        ${collapsed ? 'justify-center' : 'justify-between'}
                                        ${item.active || isExpanded
                                            ? 'bg-red-800 text-white shadow-inner ring-1 ring-yellow-500/50' 
                                            : 'text-red-100 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`
                                            ${item.active || isExpanded ? 'text-yellow-400' : 'text-red-300 group-hover:text-white'}
                                        `}>
                                            {item.icon}
                                        </span>
                                        
                                        {!collapsed && (
                                            <span className="truncate text-left">
                                                {item.title} <span className="opacity-70 font-normal">{item.subtitle}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Chevron Icon for Submodules */}
                                    {!collapsed && hasSubmodules && (
                                        <svg 
                                            className={`w-4 h-4 text-red-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    )}
                                </button>

                                {/* Submodules Container */}
                                {!collapsed && hasSubmodules && (
                                    <div className={`
                                        overflow-hidden transition-all duration-300 ease-in-out
                                        ${isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                                    `}>
                                        <div className="bg-red-950/30 rounded-lg p-1 space-y-1 ml-4 border-l border-red-800">
                                            {item.submodules!.map((subItem, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    href={subItem.href}
                                                    className="flex items-center px-3 py-2 text-xs text-red-200 hover:text-white hover:bg-white/5 rounded-md transition-colors pl-4"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-700 mr-2"></span>
                                                    {subItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Sidebar Footer & Collapse Toggle */}
                <div className="p-3 border-t border-red-800/50 bg-red-950/30 relative z-10">
                    <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center text-red-950 font-bold shrink-0 shadow-lg">
                            {user.name.charAt(0)}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-[10px] text-red-300 truncate opacity-80">{user.email}</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center p-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-200 hover:text-white transition-colors border border-red-800"
                    >
                        {collapsed ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
                        )}
                    </button>
                    
                    {!collapsed && (
                        <div className="mt-2 text-center">
                             <Link href={route('logout')} method="post" as="button" className="text-[10px] uppercase tracking-widest text-red-400 hover:text-white transition-colors">Sign out</Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                {/* Fixed Top Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Executive Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
                    
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-700/50 text-xs font-medium text-yellow-300 mb-4 backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    System Status: Operational
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2 leading-tight">
                                    Welcome back, {user.name.split(' ')[0]}
                                </h1>
                                <p className="text-red-100 max-w-xl text-lg opacity-90">
                                    You have <strong className="text-white border-b-2 border-yellow-500">3 critical stock alerts</strong> and <strong className="text-white">5 pending approvals</strong> requiring your attention today.
                                </p>
                            </div>
                            
                            <div className="shrink-0">
                                <Link 
                                    href={route('inventory.index')} 
                                    className="group relative inline-flex items-center gap-3 px-6 py-4 bg-white text-red-900 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <span>Review Inventory</span>
                                    <svg className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Inventory', value: '1,240', sub: 'Items Tracked', trend: '+12%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50', icon: modules[0].icon },
                            { label: 'Pending POs', value: '8', sub: 'Awaiting Approval', trend: '-2', trendUp: false, color: 'text-green-600', bg: 'bg-green-50', icon: modules[1].icon },
                            { label: 'Critical Stock', value: '3', sub: 'Need Reordering', trend: '+1', trendUp: false, color: 'text-orange-600', bg: 'bg-orange-50', icon: modules[3].icon },
                            { label: 'Suppliers', value: '45', sub: 'Active Partners', trend: 'Stable', trendUp: true, color: 'text-purple-600', bg: 'bg-purple-50', icon: modules[2].icon },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.icon}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                                    <p className="text-sm font-semibold text-gray-600 mt-1">{stat.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                                <p className="text-xs text-gray-500 mt-1">Real-time audit trail of system activities</p>
                            </div>
                            <button className="text-sm font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                                View Full Log
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">User</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Action</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Module</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Status</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {[
                                        { user: 'Admin User', role: 'Administrator', action: 'Stocked Out: Laptop', module: 'Inventory', status: 'Completed', time: '2 mins ago', statusColor: 'bg-green-100 text-green-800' },
                                        { user: 'Staff Member', role: 'Property Custodian', action: 'Created PR #1024', module: 'Acquisition', status: 'Pending', time: '1 hour ago', statusColor: 'bg-yellow-100 text-yellow-800' },
                                        { user: 'System', role: 'Automated', action: 'Daily Backup', module: 'System', status: 'Success', time: '5 hours ago', statusColor: 'bg-blue-100 text-blue-800' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-red-50/30 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:border-red-200 group-hover:from-red-50 group-hover:to-red-100 group-hover:text-red-700 transition-all">
                                                        {row.user.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{row.user}</div>
                                                        <div className="text-xs text-gray-400">{row.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-700">{row.action}</td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    {row.module}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${row.statusColor}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${row.statusColor.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0].replace('100', '500')}`}></span>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-medium">{row.time}</td>
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