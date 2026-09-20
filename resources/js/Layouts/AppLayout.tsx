import React, { PropsWithChildren, ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import FlashToast from '@/Components/FlashToast';
import SystemModeBadge from '@/Components/SystemModeBadge';
import ThemeToggle from '@/Components/ThemeToggle';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { PageProps } from '@/types';

interface AppLayoutProps extends PropsWithChildren {
    title?: string;
    activeModule?: string;
    activeSubmodule?: string;
    header?: ReactNode;
    actions?: ReactNode;
    breadcrumbs?: ReactNode;
}

export default function AppLayout({
    title,
    activeModule,
    activeSubmodule,
    header,
    actions,
    breadcrumbs,
    children,
}: AppLayoutProps) {
    const { auth, system, flash } = usePage<PageProps>().props;
    const user = auth.user;

    const [collapsed, toggleCollapse] = useSidebarCollapse();
    const modules = getSidebarModules(activeModule, activeSubmodule);
    const systemMode = system?.mode || 'LIVE PRODUCTION';

    return (
        <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white transition-colors">
            {title && <Head title={title} />}

            {/* Global System Mode Warning Bar */}
            {systemMode !== 'LIVE PRODUCTION' && (
                <div
                    className={`px-4 py-1.5 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b z-50 transition-colors ${
                        systemMode === 'MAINTENANCE MODE'
                            ? 'bg-amber-900 text-amber-200 border-amber-800'
                            : systemMode === 'STAGING SANDBOX'
                            ? 'bg-sky-900 text-sky-200 border-sky-800'
                            : 'bg-purple-900 text-purple-200 border-purple-800'
                    }`}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <span>
                        {systemMode === 'MAINTENANCE MODE' &&
                            'SYSTEM MAINTENANCE MODE ACTIVE — Data mutations restricted to System Administrators.'}
                        {systemMode === 'STAGING SANDBOX' &&
                            'STAGING SANDBOX ENVIRONMENT — Operating with isolated test database records.'}
                        {systemMode === 'TRAINING SIMULATION' &&
                            'TRAINING SIMULATION MODE — Operating with synthetic training data.'}
                    </span>
                </div>
            )}

            {/* Flash Message Toast */}
            <FlashToast />

            {/* Main Shell Container */}
            <div className="flex flex-1 min-h-0">
                {/* Persistent Sidebar */}
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={toggleCollapse}
                />

                {/* Content Area */}
                <div
                    className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
                        collapsed ? 'md:ml-20' : 'md:ml-72'
                    }`}
                >
                    {/* Top Application Header */}
                    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            {breadcrumbs}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            {actions}
                            <SystemModeBadge />
                            <ThemeToggle variant="compact" />
                        </div>
                    </header>

                    {/* Page Main Content */}
                    <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                        {header && <div className="mb-6">{header}</div>}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
