import React from 'react';
import { ScrollText, CheckCircle2, AlertOctagon, Users2, Filter } from 'lucide-react';
import { LoginAuditSummary as SummaryData } from '../types';

interface LoginAuditSummaryProps {
    summary: SummaryData;
    hasActiveFilters?: boolean;
}

export const LoginAuditSummary: React.FC<LoginAuditSummaryProps> = ({
    summary,
    hasActiveFilters = false,
}) => {
    const total = summary?.total ?? 0;
    const successful = summary?.successful ?? 0;
    const failed = summary?.failed ?? 0;
    const uniqueUsers = summary?.unique_users ?? 0;

    return (
        <div className="space-y-2">
            {hasActiveFilters && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-md text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Summary counts reflect active filter parameters (Search / Role / Status / Date Range).</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Records */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-red-900 dark:border-t-red-700 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Records
                        </span>
                        <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/40">
                            <ScrollText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        All recorded authentication attempts
                    </p>
                </div>

                {/* Successful */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-emerald-600 dark:border-t-emerald-500 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Successful
                        </span>
                        <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight tabular-nums">
                        {successful.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Authorized access sessions granted
                    </p>
                </div>

                {/* Failed */}
                <div className={`bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 ${
                    failed > 0 ? 'border-t-red-600 dark:border-t-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-t-gray-300 dark:border-t-slate-700'
                } shadow-2xs hover:shadow-xs transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Failed Logins
                        </span>
                        <div className={`p-1.5 rounded-md border ${
                            failed > 0 ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                        }`}>
                            <AlertOctagon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight tabular-nums ${
                        failed > 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'
                    }`}>
                        {failed.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Denied or unrecognized attempts
                    </p>
                </div>

                {/* Unique Users */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-slate-600 dark:border-t-slate-400 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Unique Users
                        </span>
                        <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Users2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {uniqueUsers.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Distinct user identities recorded
                    </p>
                </div>
            </div>
        </div>
    );
};
