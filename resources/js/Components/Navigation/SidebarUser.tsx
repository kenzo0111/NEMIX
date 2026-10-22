import React from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { roleDesignation } from '@/utils/systemIdentity';
import { Link } from '@inertiajs/react';
import { LogOut, PanelLeftClose, PanelLeftOpen, Settings, User } from 'lucide-react';
import { SidebarUser as UserType } from '@/types/navigation';
import ThemeToggle from '@/Components/ThemeToggle';

interface SidebarUserProps {
    user?: UserType;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onOpenLogoutModal: () => void;
    coordinator?: boolean;
}

export default function SidebarUser({
    user,
    collapsed = false,
    onToggleCollapse,
    onOpenLogoutModal,
    coordinator = false,
}: SidebarUserProps) {
    const isAccountSettingsActive = Boolean(
        typeof route === 'function' &&
            (route().current('profile.edit') || route().current('account.settings'))
    );

    const userName = user?.name || 'Administrator';
    const userRole = roleDesignation(usePage<PageProps>().props.auth);
    const initial = userName.charAt(0).toUpperCase() || 'U';

    if (collapsed) {
        return (
            <div className="p-2 border-t border-red-900/60 bg-red-950/60 relative z-10 flex flex-col items-center gap-2 select-none">
                {/* User Avatar with Tooltip */}
                <div
                    className="w-9 h-9 rounded-lg bg-red-900 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm"
                    title={`${userName} (${userRole})`}
                >
                    {initial}
                </div>

                {/* Account Settings Icon Link */}
                <Link
                    href={route('profile.edit')}
                    aria-current={isAccountSettingsActive ? 'page' : undefined}
                    className={`p-2 rounded-lg transition-colors ${
                        isAccountSettingsActive
                            ? 'bg-red-900 text-amber-300'
                            : 'text-red-200/70 hover:text-white hover:bg-white/5'
                    }`}
                    title="Account Settings"
                >
                    <User className="w-4 h-4" />
                </Link>

                {/* Theme Toggle Icon in Collapsed State */}
                <ThemeToggle variant="compact" placement="right-end" />

                {/* Expand Toggle */}
                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="p-2 rounded-lg text-red-200/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Expand Sidebar"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}

                {/* Sign Out Button */}
                <button
                    type="button"
                    onClick={onOpenLogoutModal}
                    className="p-2 rounded-lg text-red-200/70 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative z-10 space-y-2 border-t border-red-900/60 bg-red-950/70 p-3">
            <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/25 bg-red-900 text-sm font-semibold text-white">{initial}</span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white" title={userName}>{userName}</p>
                    <p className="mt-0.5 truncate text-xs text-amber-300" title={userRole}>{userRole}</p>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <Link href={route('profile.edit')} aria-current={isAccountSettingsActive ? 'page' : undefined} className={`flex min-h-10 flex-1 items-center gap-3 rounded-lg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${isAccountSettingsActive ? 'bg-red-900/60 text-white' : 'text-red-200/80 hover:bg-white/5 hover:text-white'}`}>
                    <Settings size={18} aria-hidden="true" />Account settings
                </Link>
                <ThemeToggle variant="compact" placement="right-end" />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-red-900/40 pt-1">
                <button type="button" onClick={onOpenLogoutModal} className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-red-200/80 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                    <LogOut size={18} aria-hidden="true" />Sign Out
                </button>
                {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label="Collapse sidebar" title="Collapse sidebar" className="hidden h-10 w-10 items-center justify-center rounded-lg text-red-200/70 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 md:inline-flex"><PanelLeftClose size={17} aria-hidden="true" /></button>}
            </div>
        </div>
    );
}
