import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { StaffStats } from '../types';

interface StaffSummaryProps {
    stats: StaffStats;
}

export default function StaffSummary({ stats }: StaffSummaryProps) {
    return (
        <section aria-labelledby="staff-summary-heading" className="space-y-3">
            <h2 id="staff-summary-heading" className="sr-only">
                Staff Roster Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Staff Accounts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-red-900 dark:border-t-red-700 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Staff
                        </span>
                        <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100/80 dark:border-red-900/40">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {stats.total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Registered university personnel
                    </p>
                </div>

                {/* 2. Active Accounts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-emerald-600 dark:border-t-emerald-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Active Accounts
                        </span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight tabular-nums">
                        {stats.active.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Active operational credentials
                    </p>
                </div>

                {/* 3. Disabled Accounts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-slate-700 dark:border-t-slate-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Disabled Accounts
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <UserX className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {stats.disabled.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Revoked or pending access
                    </p>
                </div>

                {/* 4. Assigned Roles */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-amber-600 dark:border-t-amber-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Assigned Roles
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {stats.rolesAssigned.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Distinct security roles
                    </p>
                </div>
            </div>
        </section>
    );
}

