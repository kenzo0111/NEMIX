import React from 'react';
import { Menu } from 'lucide-react';
import SystemModeBadge from '@/Components/SystemModeBadge';
import ThemeToggle from '@/Components/ThemeToggle';
import { usePage } from '@inertiajs/react';

interface DashboardHeaderProps {
    onToggleSidebar?: () => void;
    coordinator?: boolean;
}

export default function DashboardHeader({ onToggleSidebar, coordinator }: DashboardHeaderProps) {
    const system = (usePage().props as any).system;
    const isCoordinator = coordinator ?? ((usePage().props as any).inventoryScope === 'coordinator');
    const systemMode = system?.mode || 'LIVE PRODUCTION';

    const todayDate = new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const todayWeekday = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
    });

    const handleToggleMenu = () => {
        if (onToggleSidebar) {
            onToggleSidebar();
        } else {
            window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar'));
        }
    };

    return (
        <header className={`sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-xs transition-colors ${isCoordinator ? 'border-t-4 border-red-900 dark:border-red-700' : ''}`}>
            {/* Non-Production Mode Alert Notice */}
            {systemMode && systemMode !== 'LIVE PRODUCTION' && (
                <div
                    className={`px-4 sm:px-6 py-2 text-sm font-semibold text-center flex items-center justify-center gap-2 border-b ${
                        systemMode === 'MAINTENANCE MODE'
                            ? 'bg-amber-950 text-amber-200 border-amber-800'
                            : systemMode === 'STAGING SANDBOX'
                            ? 'bg-sky-950 text-sky-200 border-sky-800'
                            : 'bg-purple-950 text-purple-200 border-purple-800'
                    }`}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <span>
                        {systemMode === 'MAINTENANCE MODE' &&
                            'Maintenance mode: only System Administrators can make changes.'}
                        {systemMode === 'STAGING SANDBOX' &&
                            'Staging environment: using isolated test data.'}
                        {systemMode === 'TRAINING SIMULATION' &&
                            'Training mode: using sample data.'}
                    </span>
                </div>
            )}

            {/* Single Merged Header Row */}
            <div className="border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={handleToggleMenu}
                        className="md:hidden min-h-[40px] min-w-[40px] p-2 -ml-1 text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-red-950 dark:text-red-400">
                                {isCoordinator ? 'Delivery Unit Supply Coordinator' : 'Supply & Property Management'}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 font-sans tracking-tight break-words">
                            {isCoordinator ? 'My supplies' : 'Dashboard'}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-normal mt-1 leading-relaxed break-words">
                            {isCoordinator ? 'Track unit stock, requests, and distributions.' : 'Monitor stock, requests, and recent activity.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 justify-between xl:justify-end">
                    <SystemModeBadge />
                    <ThemeToggle variant="compact" />
                    <div className="text-right hidden xl:block border-l border-gray-200 dark:border-slate-800 pl-4">
                        <span className="block text-sm font-bold text-gray-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
                            {todayDate}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-slate-400 normal-case tracking-normal font-semibold block mt-0.5">
                            {todayWeekday}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
