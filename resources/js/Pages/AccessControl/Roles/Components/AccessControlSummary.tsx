import React from 'react';
import { Shield, KeyRound, Layers, ShieldCheck } from 'lucide-react';

interface AccessControlSummaryProps {
    rolesCount: number;
    permissionsCount: number;
    modulesCount: number;
}

export default function AccessControlSummary({
    rolesCount,
    permissionsCount,
    modulesCount,
}: AccessControlSummaryProps) {
    return (
        <section aria-labelledby="summary-heading" className="space-y-3">
            <h2 id="summary-heading" className="sr-only">
                Access Control Summary Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Configured Roles */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-red-900 dark:border-t-red-700 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Configured Roles
                        </span>
                        <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {rolesCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Active institutional access roles
                    </p>
                </div>

                {/* 2. System Permissions */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-slate-700 dark:border-t-slate-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            System Permissions
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <KeyRound className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {permissionsCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Granular capability definitions
                    </p>
                </div>

                {/* 3. Protected Modules */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-amber-600 dark:border-t-amber-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            System Modules
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {modulesCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Protected functional subsystems
                    </p>
                </div>

                {/* 4. Access Model */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-emerald-600 dark:border-t-emerald-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Access Model
                        </span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-base font-bold text-emerald-800 dark:text-emerald-400 tracking-tight mt-1 truncate">
                        RBAC Enforced
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1.5 font-medium">
                        Strict role-based authorization
                    </p>
                </div>
            </div>
        </section>
    );
}

