import React from 'react';
import { Link } from '@inertiajs/react';
import { LogOut, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react';
import { SidebarUser as UserType } from '@/types/navigation';

interface SidebarUserProps {
    user?: UserType;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onOpenLogoutModal: () => void;
}

export default function SidebarUser({
    user,
    collapsed = false,
    onToggleCollapse,
    onOpenLogoutModal,
}: SidebarUserProps) {
    const isAccountSettingsActive = Boolean(
        typeof route === 'function' &&
            (route().current('profile.edit') || route().current('account.settings'))
    );

    const userName = user?.name || 'Administrator';
    const userRole = user?.primary_role || user?.role || 'Supply Officer';
    const initial = userName.charAt(0).toUpperCase() || 'U';

    if (collapsed) {
        return (
            <div className="p-2 border-t border-red-900/60 bg-red-950/60 relative z-10 flex flex-col items-center gap-2 select-none">
                {/* User Avatar with Tooltip */}
                <div
                    className="w-9 h-9 rounded-lg bg-red-900 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs"
                    title={`${userName} (${userRole})`}
                >
                    {initial}
                </div>

                {/* Account Settings Icon Link */}
                <Link
                    href={route('profile.edit')}
                    className={`p-2 rounded-lg transition-colors ${
                        isAccountSettingsActive
                            ? 'bg-red-900 text-amber-300'
                            : 'text-red-200/70 hover:text-white hover:bg-white/5'
                    }`}
                    title="Account Settings"
                >
                    <User className="w-4 h-4" />
                </Link>

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
        <div className="p-3 border-t border-red-900/60 bg-red-950/60 relative z-10 space-y-2 select-none">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-lg bg-red-900 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {initial}
                </div>
                <div className="min-w-0 flex-1 truncate">
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                        {userName}
                    </p>
                    <p className="text-[10px] text-amber-400/90 font-medium truncate">
                        {userRole}
                    </p>
                </div>
            </div>

            {/* Account Settings Link */}
            <Link
                href={route('profile.edit')}
                className={`block px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isAccountSettingsActive
                        ? 'bg-red-900/60 text-amber-300 font-medium'
                        : 'text-red-200/80 hover:text-white hover:bg-white/5'
                }`}
            >
                Account Settings
            </Link>

            {/* Controls: Collapse & Sign Out */}
            <div className="flex items-center justify-between pt-2 border-t border-red-900/40 text-xs">
                {onToggleCollapse ? (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="flex items-center gap-1.5 text-red-200/70 hover:text-white py-1 px-1.5 rounded transition-colors text-[11px] font-medium cursor-pointer"
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
                    className="flex items-center gap-1.5 text-red-200/70 hover:text-amber-300 py-1 px-1.5 rounded transition-colors text-[11px] font-medium cursor-pointer ml-auto"
                    title="Sign Out"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
