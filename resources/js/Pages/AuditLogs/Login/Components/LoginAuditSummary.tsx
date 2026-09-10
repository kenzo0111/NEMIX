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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 border border-amber-200/70 rounded-md text-[11px] text-amber-800 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Summary counts reflect active filter parameters (Search / Role / Status / Date Range).</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Records */}
                <div className="bg-white rounded-lg p-4 border border-gray-200/80 border-t-2 border-t-red-900 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Total Records
                        </span>
                        <div className="p-1.5 rounded-md bg-red-50 text-red-900 border border-red-100">
                            <ScrollText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        All recorded authentication attempts
                    </p>
                </div>

                {/* Successful */}
                <div className="bg-white rounded-lg p-4 border border-gray-200/80 border-t-2 border-t-emerald-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Successful
                        </span>
                        <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800 tracking-tight tabular-nums">
                        {successful.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Authorized access sessions granted
                    </p>
                </div>

                {/* Failed */}
                <div className={`bg-white rounded-lg p-4 border border-gray-200/80 border-t-2 ${
                    failed > 0 ? 'border-t-red-600 bg-red-50/20' : 'border-t-gray-300'
                } shadow-2xs hover:shadow-xs transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Failed Logins
                        </span>
                        <div className={`p-1.5 rounded-md border ${
                            failed > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                            <AlertOctagon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight tabular-nums ${
                        failed > 0 ? 'text-red-700' : 'text-gray-900'
                    }`}>
                        {failed.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Denied or unrecognized attempts
                    </p>
                </div>

                {/* Unique Users */}
                <div className="bg-white rounded-lg p-4 border border-gray-200/80 border-t-2 border-t-slate-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Unique Users
                        </span>
                        <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            <Users2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {uniqueUsers.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Distinct user identities recorded
                    </p>
                </div>
            </div>
        </div>
    );
};
