import React, { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import SystemModeBadge from '@/Components/SystemModeBadge';

export interface BreadcrumbItem {
    name: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    systemTag?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    badges?: ReactNode;
    showDate?: boolean;
    showSystemMode?: boolean;
    children?: ReactNode;
}

export default function PageHeader({
    title,
    subtitle,
    systemTag = 'SPMO — Supply & Inventory Management System',
    breadcrumbs,
    actions,
    badges,
    showDate = true,
    showSystemMode = true,
    children,
}: PageHeaderProps) {
    const pageProps = usePage().props as any;
    const systemMode = pageProps.system?.mode;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const formattedDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <header className="sticky top-0 z-40 shadow-xs">
            {/* Non-Production Mode Alert Banner (conditional — stays separate) */}
            {systemMode && systemMode !== 'LIVE PRODUCTION' && (
                <div
                    className={`px-6 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
                        systemMode === 'MAINTENANCE MODE'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : systemMode === 'STAGING SANDBOX'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <span>
                        {systemMode === 'MAINTENANCE MODE' &&
                            'SYSTEM MAINTENANCE MODE ACTIVE — Write operations restricted to System Administrators.'}
                        {systemMode === 'STAGING SANDBOX' &&
                            'STAGING SANDBOX ENVIRONMENT — Operating with isolated test database.'}
                        {systemMode === 'TRAINING SIMULATION' &&
                            'TRAINING SIMULATION MODE — Operating with synthetic demo data.'}
                    </span>
                </div>
            )}

            {/* Single Merged Header Layer */}
            <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {systemTag && (
                        <div className="flex items-center gap-3 mb-0.5">
                            <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider">
                                {systemTag}
                            </span>
                        </div>
                    )}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="mb-0.5">
                            <Breadcrumbs items={breadcrumbs} />
                        </div>
                    )}
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold text-gray-900 font-serif tracking-tight">
                            {title}
                        </h2>
                        {badges && <div className="flex items-center gap-2">{badges}</div>}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-gray-500 font-medium">
                            {subtitle}
                        </p>
                    )}
                    {children}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {actions && <div className="flex items-center gap-2.5">{actions}</div>}
                    {showSystemMode && <SystemModeBadge />}
                    {showDate && (
                        <div className="text-right hidden sm:block border-l border-gray-200 pl-4">
                            <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                {formattedDate}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                {formattedDay}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
