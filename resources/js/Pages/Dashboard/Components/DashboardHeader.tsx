import React from 'react';
import SystemModeBadge from '@/Components/SystemModeBadge';
import { usePage } from '@inertiajs/react';

export default function DashboardHeader() {
    const system = (usePage().props as any).system;
    const systemMode = system?.mode || 'LIVE PRODUCTION';

    const todayDate = new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const todayWeekday = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
    });

    return (
        <header className="sticky top-0 z-40 bg-white shadow-xs">
            {/* Non-Production Mode Alert Notice */}
            {systemMode && systemMode !== 'LIVE PRODUCTION' && (
                <div
                    className={`px-6 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 border-b ${
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
                            'SYSTEM MAINTENANCE MODE ACTIVE — Data modification restricted to authorized System Administrators.'}
                        {systemMode === 'STAGING SANDBOX' &&
                            'STAGING SANDBOX ENVIRONMENT — Operating with isolated verification database.'}
                        {systemMode === 'TRAINING SIMULATION' &&
                            'TRAINING SIMULATION MODE — Operating with synthetic demonstration data.'}
                    </span>
                </div>
            )}

            {/* Single Merged Header Row */}
            <div className="border-b border-gray-200 px-6 lg:px-8 py-3.5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-red-900 uppercase tracking-widest">
                            SPMO • Supply & Property Management Office
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 font-serif tracking-tight">
                        Supply & Inventory Management
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        System-wide operational overview and real-time asset position
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <SystemModeBadge />
                    <div className="text-right hidden sm:block border-l border-gray-200 pl-4">
                        <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                            {todayDate}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                            {todayWeekday}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
