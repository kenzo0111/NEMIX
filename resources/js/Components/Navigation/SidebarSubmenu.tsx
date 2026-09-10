import React from 'react';
import { Link } from '@inertiajs/react';
import { SidebarSubmodule } from '@/types/navigation';

interface SidebarSubmenuProps {
    submodules: SidebarSubmodule[];
    isExpanded: boolean;
    collapsed?: boolean;
}

export default function SidebarSubmenu({
    submodules,
    isExpanded,
    collapsed = false,
}: SidebarSubmenuProps) {
    if (collapsed || submodules.length === 0) {
        return null;
    }

    return (
        <div
            className={`
                overflow-hidden transition-all duration-200 ease-in-out
                ${isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'}
            `}
        >
            <div className="ml-5 pl-3 py-1 space-y-0.5 border-l border-amber-400/30">
                {submodules.map((subItem) => (
                    <Link
                        key={subItem.key}
                        href={subItem.href}
                        className={`
                            flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors duration-150 whitespace-nowrap
                            ${
                                subItem.active
                                    ? 'text-amber-300 font-medium bg-red-900/50'
                                    : 'text-red-200/70 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                    subItem.active ? 'bg-amber-400' : 'bg-red-800'
                                }`}
                            />
                            <span className="truncate">{subItem.title}</span>
                        </div>

                        {subItem.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium shrink-0 ml-2">
                                {subItem.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
