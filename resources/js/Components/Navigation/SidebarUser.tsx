import React from 'react';
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
    const userRole = user?.primary_role || user?.role || (coordinator ? 'Supply Coordinator' : 'Supply Officer');
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

    if (coordinator) {
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

    return (
        <div className="p-3 border-t border-red-900/60 bg-red-950/60 relative z-10 space-y-2.5 select-none">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-lg bg-red-900 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {initial}
                </div>
                <div className="min-w-0 flex-1 truncate">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                        {userName}
                    </p>
                    <p className="leading-relaxed text-sm text-amber-400/90 font-medium truncate">
                        {userRole}
                    </p>
                </div>
            </div>

            {/* Account Settings Link */}
            <Link
                href={route('profile.edit')}
                aria-current={isAccountSettingsActive ? 'page' : undefined}
                className={`block px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                    isAccountSettingsActive
                        ? 'bg-red-900/60 text-amber-300 font-medium'
                        : 'text-red-200/80 hover:text-white hover:bg-white/5'
                }`}
            >
                Account Settings
            </Link>

            {/* Theme Selector Strip in Sidebar */}
            <div className="pt-1">
                <div className="flex items-center justify-between px-1 mb-1 text-sm normal-case font-bold tracking-normal text-red-300/60">
                    <span>Appearance</span>
                </div>
                <ThemeToggle variant="sidebar" />
            </div>

            {/* Controls: Collapse & Sign Out */}
            <div className="flex items-center justify-between pt-2 border-t border-red-900/40 text-sm">
                {onToggleCollapse ? (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="hidden md:flex items-center gap-1.5 text-red-200/70 hover:text-white py-1 px-1.5 rounded transition-colors text-sm font-medium cursor-pointer"
                        title="Collapse Sidebar"
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                        <span>Collapse</span>
                    </button>
                ) : (
                    <div />
                )}

                <button
                    type="button"
                    onClick={onOpenLogoutModal}
                    className="flex items-center gap-1.5 text-red-200/70 hover:text-amber-300 py-1 px-1.5 rounded transition-colors text-sm font-medium cursor-pointer ml-auto"
                    title="Sign Out"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
