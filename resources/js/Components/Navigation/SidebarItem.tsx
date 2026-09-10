import React, { isValidElement, ComponentType } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, LucideProps } from 'lucide-react';
import { SidebarModule } from '@/types/navigation';
import SidebarSubmenu from './SidebarSubmenu';

interface SidebarItemProps {
    item: SidebarModule;
    isExpanded: boolean;
    onToggle: (title: string) => void;
    collapsed?: boolean;
}

export default function SidebarItem({
    item,
    isExpanded,
    onToggle,
    collapsed = false,
}: SidebarItemProps) {
    const hasSubmodules = Boolean(item.submodules && item.submodules.length > 0);
    const isSubmoduleActive = Boolean(
        hasSubmodules && item.submodules?.some((sub) => sub.active)
    );
    const isItemActive = Boolean(item.active || isSubmoduleActive);

    const renderIcon = () => {
        if (!item.icon) return null;
        if (isValidElement(item.icon)) {
            return item.icon;
        }
        const IconComponent = item.icon as ComponentType<LucideProps>;
        return <IconComponent className="w-5 h-5 shrink-0" />;
    };

    const buttonContent = (
        <div
            className={`
                relative w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer overflow-hidden
                ${
                    isItemActive
                        ? 'bg-red-900/60 text-white'
                        : 'text-red-200/80 hover:bg-white/5 hover:text-white'
                }
            `}
            title={collapsed ? item.title : undefined}
        >
            {/* Subtle Gold Left Border Indicator */}
            {isItemActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r-sm" />
            )}

            <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                    className={`shrink-0 flex items-center justify-center transition-colors ${
                        isItemActive ? 'text-amber-400' : 'text-red-300/80 group-hover:text-amber-300'
                    }`}
                >
                    {renderIcon()}
                </span>

                <div
                    className={`truncate text-left leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                        collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[170px] opacity-100'
                    }`}
                >
                    <span className="tracking-wide">{item.title}</span>
                    {item.badge && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">
                            {item.badge}
                        </span>
                    )}
                </div>
            </div>

            {hasSubmodules && !collapsed && (
                <ChevronDown
                    className={`w-4 h-4 text-red-300/70 transition-transform duration-200 shrink-0 ml-auto ${
                        isExpanded ? 'rotate-180 text-amber-400' : ''
                    }`}
                />
            )}
        </div>
    );

    return (
        <div className="relative select-none">
            {hasSubmodules ? (
                <button
                    type="button"
                    onClick={() => onToggle(item.title)}
                    className="w-full text-left focus:outline-none focus:ring-1 focus:ring-amber-400/40 rounded-lg"
                    aria-expanded={isExpanded}
                >
                    {buttonContent}
                </button>
            ) : (
                <Link
                    href={item.href || '#'}
                    className="w-full block focus:outline-none focus:ring-1 focus:ring-amber-400/40 rounded-lg"
                >
                    {buttonContent}
                </Link>
            )}

            {hasSubmodules && item.submodules && (
                <SidebarSubmenu
                    submodules={item.submodules}
                    isExpanded={isExpanded}
                    collapsed={collapsed}
                />
            )}
        </div>
    );
}
