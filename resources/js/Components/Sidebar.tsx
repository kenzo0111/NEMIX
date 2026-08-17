import { Link, usePage } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export interface Submodule {
    title: string;
    href: string;
    active?: boolean;
    badge?: string;
}

export interface Module {
    title: string;
    subtitle: string;
    icon: ReactNode;
    href?: string;
    active?: boolean;
    color?: string;
    bg?: string;
    category?: string;
    badge?: string;
    submodules?: Submodule[];
}

interface SidebarProps {
    modules: Module[];
    user?: {
        name?: string;
        email?: string;
        role?: string;
        roles?: string[];
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
    const pageProps = usePage().props as any;
    const currentUser = user || pageProps.auth?.user;

    const userRole =
        currentUser?.role ||
        (Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
            ? typeof currentUser.roles[0] === 'string'
                ? currentUser.roles[0]
                : currentUser.roles[0]?.name
            : null) ||
        'Supply Officer';

    // Find active module to auto-expand accordion
    const activeModuleTitle = modules.find(
        (m) => m.active || (m.submodules && m.submodules.some((s) => s.active))
    )?.title;

    const [expandedModule, setExpandedModule] = useState<string | null>(activeModuleTitle || null);


    // Keep expanded module synced if active module changes
    useEffect(() => {
        if (activeModuleTitle && !collapsed) {
            setExpandedModule(activeModuleTitle);
        }
    }, [activeModuleTitle, collapsed]);

    const toggleSubmenu = (title: string) => {
        if (collapsed) {
            if (onToggleCollapse) onToggleCollapse();
            setExpandedModule(title);
        } else {
            setExpandedModule((prev) => (prev === title ? null : title));
        }
    };

    const handleToggleCollapse = () => {
        if (onToggleCollapse) onToggleCollapse();
    };

    // Extract unique categories (e.g. Overview, Logistics & Operations, Administration & Governance)
    const categories = Array.from(
        new Set(modules.map((m) => m.category || 'Main Modules'))
    );

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-red-950 via-red-950 to-slate-950 border-r border-red-900/80
                text-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col select-none overflow-x-hidden
                ${collapsed ? 'w-20' : 'w-72'} ${className}
            `}
        >
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>

            {/* Top Institutional Bar Extension (Matches & Aligns with Top Institutional Bar) */}
            <div className="bg-red-950 text-red-100 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide h-[33px] shrink-0 select-none">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold tracking-wider uppercase text-amber-300 truncate text-[10px] font-mono">
                        {collapsed ? 'UCN' : 'INVENTORY PORTAL'}
                    </span>
                </div>
                {!collapsed && (
                    <span className="text-[9px] text-red-300/80 font-mono tracking-widest uppercase">
                        SPMO v2.0
                    </span>
                )}
            </div>

            {/* University Branding & Crest Header */}
            <div className="p-4 border-b border-red-900/60 relative z-10 flex items-center h-20 gap-3.5 px-4 overflow-hidden bg-red-950/40">
                <div className="relative shrink-0 group">
                    <div className="w-11 h-11 rounded-full bg-white p-1 shadow-lg shadow-black/40 border-2 border-yellow-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        <ApplicationLogo className="w-8 h-8 object-contain" alt="UCN Logo" />
                    </div>
                    {/* Subtle Online Pulse Dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-red-950" title="System Online"></span>
                </div>

                <div className={`whitespace-nowrap flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'}`}>
                    <h1 className="font-extrabold tracking-wider text-base text-white drop-shadow-sm leading-tight">UCN SPMO</h1>
                    <p className="text-[10px] text-yellow-400/90 font-medium uppercase tracking-widest leading-normal truncate">
                        Supply & Property Management
                    </p>
                </div>
            </div>

            {/* University System Nav Categories & Links */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-4 relative z-10 scrollbar-hide no-scrollbar">
                {categories.map((category) => {
                    const categoryModules = modules.filter(
                        (m) => (m.category || 'Main Modules') === category
                    );

                    return (
                        <div key={category} className="space-y-1">
                            <div className={`px-3 pt-2 pb-1 flex items-center justify-between text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? 'max-h-0 opacity-0 pointer-events-none py-0' : 'max-h-8 opacity-100'}`}>
                                <span>{category}</span>
                                <span className="h-[1px] flex-1 bg-red-800/40 ml-2"></span>
                            </div>

                            {categoryModules.map((item, index) => {
                                const hasSubmodules = item.submodules && item.submodules.length > 0;
                                const isSubmoduleActive = hasSubmodules && item.submodules!.some((s) => s.active);
                                const isItemActive = item.active || isSubmoduleActive;
                                const isExpanded = expandedModule === item.title;

                                const ItemContent = (
                                    <div
                                        className={`
                                            relative w-full group flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
                                            ${isItemActive
                                                ? 'bg-red-800/90 text-white shadow-lg border border-red-700/50 ring-1 ring-yellow-500/40'
                                                : 'text-red-100/90 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                        title={collapsed ? item.title : undefined}
                                    >
                                        {/* Active Indicator Bar */}
                                        {isItemActive && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-yellow-400 rounded-r-full shadow-sm shadow-yellow-400/50"></span>
                                        )}

                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span
                                                className={`
                                                    w-9 h-9 rounded-lg transition-colors shrink-0 flex items-center justify-center
                                                    ${isItemActive ? 'text-yellow-400 bg-red-950/40' : 'text-red-300 group-hover:text-yellow-300 group-hover:bg-white/5'}
                                                `}
                                            >
                                                {item.icon}
                                            </span>

                                            <div className={`truncate text-left leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100'}`}>
                                                <div className="font-semibold text-xs tracking-wide flex items-center gap-2">
                                                    <span>{item.title}</span>
                                                    {item.badge && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold uppercase tracking-widest">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-red-200/60 font-normal truncate block">
                                                    {item.subtitle}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chevron Icon for Submodules */}
                                        {hasSubmodules && (
                                            <svg
                                                className={`w-4 h-4 text-red-300/80 transition-all duration-300 shrink-0 ml-auto ${isExpanded ? 'rotate-180 text-yellow-400' : ''
                                                    } ${collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-4 opacity-100'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        )}
                                    </div>
                                );

                                return (
                                    <div key={index} className="relative">
                                        {hasSubmodules ? (
                                            <button
                                                onClick={() => toggleSubmenu(item.title)}
                                                className="w-full text-left"
                                            >
                                                {ItemContent}
                                            </button>
                                        ) : (
                                            <Link href={item.href || '#'} className="w-full block">
                                                {ItemContent}
                                            </Link>
                                        )}

                                        {/* Submodules Container */}
                                        {hasSubmodules && (
                                            <div
                                                className={`
                                                    overflow-hidden transition-all duration-300 ease-in-out
                                                    ${!collapsed && isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'}
                                                `}
                                            >
                                                <div className="ml-5 pl-3 py-1 space-y-1 border-l-2 border-yellow-500/30 bg-red-950/40 rounded-r-xl">
                                                    {item.submodules!.map((subItem, subIndex) => (
                                                        <Link
                                                            key={subIndex}
                                                            href={subItem.href}
                                                            className={`
                                                                flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-all duration-150 whitespace-nowrap overflow-hidden
                                                                ${subItem.active
                                                                    ? 'text-yellow-300 bg-yellow-500/20 font-semibold border border-yellow-500/40 shadow-sm shadow-yellow-500/10'
                                                                    : 'text-red-200/80 hover:text-white hover:bg-white/10'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full transition-transform shrink-0 ${subItem.active
                                                                            ? 'bg-yellow-400 shadow-sm shadow-yellow-400/80 scale-125'
                                                                            : 'bg-red-700'
                                                                        }`}
                                                                ></span>
                                                                <span className="truncate">{subItem.title}</span>
                                                            </div>
                                                            {subItem.badge && (
                                                                <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-500/20 text-yellow-300 font-bold shrink-0">
                                                                    {subItem.badge}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Institutional User Profile Footer & Collapse Controls */}
            <div className="p-3 border-t border-red-800/60 bg-red-950/60 relative z-10 space-y-2 overflow-hidden">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300/60 flex items-center justify-center text-red-950 font-extrabold text-base shrink-0 shadow-md shadow-yellow-500/20">
                        {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className={`whitespace-nowrap flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[170px] opacity-100'}`}>
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate leading-tight">{currentUser?.name || 'SPMO Administrator'}</p>
                        </div>
                        <p className="text-[10px] text-red-300/80 truncate">{currentUser?.email || 'admin@ucn.edu.ph'}</p>
                        <span className="inline-block mt-0.5 text-[9px] text-yellow-300/90 font-medium tracking-wide">
                            {userRole}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleCollapse}
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        className="w-full flex items-center justify-center p-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 hover:text-white transition-all border border-red-800/80 shadow-sm gap-2"
                    >
                        <svg className={`w-5 h-5 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                        </svg>
                        <span className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
                            Collapse Sidebar
                        </span>
                    </button>
                </div>

                <div className={`pt-1.5 text-center border-t border-red-800/30 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0 pointer-events-none py-0 border-t-0' : 'max-h-10 opacity-100'}`}>
                    {currentUser ? (
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full py-1 text-[10px] font-bold uppercase tracking-widest text-red-300/70 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            <span>Logout Session</span>
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="w-full py-1 text-[10px] font-bold uppercase tracking-widest text-red-300/70 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span>System Login</span>
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );
}