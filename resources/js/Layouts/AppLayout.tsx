import React, { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import SystemModeBadge from '@/Components/SystemModeBadge';
import { getSidebarModules } from '@/utils/sidebarConfig';
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

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const [flashAlert, setFlashAlert] = useState<{
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    } | null>(null);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    useEffect(() => {
        if (flash?.success) {
            setFlashAlert({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setFlashAlert({ type: 'error', message: flash.error });
        } else if (flash?.warning) {
            setFlashAlert({ type: 'warning', message: flash.warning });
        } else if (flash?.status) {
            setFlashAlert({ type: 'info', message: flash.status });
        }
    }, [flash]);

    useEffect(() => {
        if (flashAlert) {
            const timer = setTimeout(() => setFlashAlert(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flashAlert]);

    const modules = getSidebarModules(activeModule, activeSubmodule);
    const systemMode = system?.mode || 'LIVE PRODUCTION';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white">
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
            {flashAlert && (
                <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
                    <div
                        className={`rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                            flashAlert.type === 'success'
                                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                                : flashAlert.type === 'error'
                                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                                : flashAlert.type === 'warning'
                                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                                : 'bg-sky-50/95 border-sky-200 text-sky-900'
                        }`}
                    >
                        <div className="shrink-0 mt-0.5">
                            {flashAlert.type === 'success' && (
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {flashAlert.type === 'error' && (
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {flashAlert.type === 'warning' && (
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            {flashAlert.type === 'info' && (
                                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 text-sm font-medium leading-snug">{flashAlert.message}</div>
                        <button
                            onClick={() => setFlashAlert(null)}
                            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

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
                    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {breadcrumbs}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            {actions}
                            <SystemModeBadge />
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
