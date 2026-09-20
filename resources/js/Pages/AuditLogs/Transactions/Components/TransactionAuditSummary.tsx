import React from 'react';
import { ScrollText, CheckCircle2, AlertTriangle, Layers, Filter } from 'lucide-react';
import { TransactionAuditSummary as SummaryData } from '../types';

interface TransactionAuditSummaryProps {
    summary: SummaryData;
    hasActiveFilters?: boolean;
}

export const TransactionAuditSummary: React.FC<TransactionAuditSummaryProps> = ({
    summary,
    hasActiveFilters = false,
}) => {
    const total = summary?.total ?? 0;
    const verified = summary?.verified ?? 0;
    const flagged = summary?.flagged ?? 0;
    const modules = summary?.modules ?? 0;

    return (
        <div className="space-y-2">
            {hasActiveFilters && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 rounded-md text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Summary counts reflect active filter parameters (Search / Module / Action / Date Range).</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Records */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-red-900 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Records
                        </span>
                        <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/50">
                            <ScrollText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        All recorded system activities
                    </p>
                </div>

                {/* Verified */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-emerald-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Verified Actions
                        </span>
                        <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight tabular-nums">
                        {verified.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Approved system operations
                    </p>
                </div>

                {/* Flagged */}
                <div className={`bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 ${
                    flagged > 0 ? 'border-t-amber-600 bg-amber-50/20 dark:bg-amber-950/20' : 'border-t-gray-300 dark:border-t-slate-700'
                } shadow-2xs hover:shadow-xs transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Flagged Entries
                        </span>
                        <div className={`p-1.5 rounded-md border ${
                            flagged > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                        }`}>
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight tabular-nums ${
                        flagged > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-gray-900 dark:text-slate-100'
                    }`}>
                        {flagged.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Exceptions and warnings recorded
                    </p>
                </div>

                {/* Modules Represented */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200/80 dark:border-slate-800 border-t-2 border-t-slate-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Modules Represented
                        </span>
                        <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {modules.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        System operational areas
                    </p>
                </div>
            </div>
        </div>
    );
};
