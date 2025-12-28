import { Link } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface Submodule {
    title: string;
    href: string;
    active?: boolean;
}

interface Module {
    title: string;
    subtitle: string;
    icon: ReactNode;
    href?: string;
    active?: boolean;
    color: string;
    bg: string;
    submodules?: Submodule[];
}

interface SidebarProps {
    modules: Module[];
    user?: {
        name: string;
        email: string;
    };
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    className?: string;
}

export default function Sidebar({
    modules,
    user,
    collapsed = false,
    onToggleCollapse,
    className = ''
}: SidebarProps) {
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    const toggleSubmenu = (title: string) => {
        if (collapsed) {
            if (onToggleCollapse) onToggleCollapse();
            setExpandedModule(title);
        } else {
            setExpandedModule(expandedModule === title ? null : title);
        }
    };

    const handleToggleCollapse = () => {
        if (onToggleCollapse) onToggleCollapse();
    };

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-red-900 to-red-950 border-r border-red-800
                text-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col
                ${collapsed ? 'w-20' : 'w-72'} ${className}
            `}
        >
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>

            {/* Branding Section */}
            <div className={`p-6 flex items-center border-b border-red-800/50 relative z-10 transition-all h-[88px] ${collapsed ? 'justify-center' : 'justify-start gap-4'}`}>
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
                                                className={`flex items-center px-3 py-2 text-xs rounded-md transition-colors pl-4 ${
                                                    subItem.active
                                                        ? 'text-white bg-yellow-500/20 border border-yellow-500/30'
                                                        : 'text-red-200 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                    subItem.active ? 'bg-yellow-400' : 'bg-red-700'
                                                }`}></span>
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
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] text-red-300 truncate opacity-80">{user?.email || 'admin@cnsc.edu.ph'}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleToggleCollapse}
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
                         <Link href={route('login')} className="text-[10px] uppercase tracking-widest text-red-400 hover:text-white transition-colors">Login</Link>
                    </div>
                )}
            </div>
        </aside>
    );
}