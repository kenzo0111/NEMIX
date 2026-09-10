import React from 'react';
import { Filter } from 'lucide-react';
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-md text-xs text-amber-900 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Summary metrics reflect active filter parameters (Search / Module / Action / Date Range).</span>
                </div>
            )}

            {/* Compact Summary Strip */}
            <div className="bg-white rounded-lg border border-gray-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Transaction Audit Summary
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                        System Activity Counts
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Total Records */}
                    <div className="p-4 sm:px-6 sm:py-4">
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Total Records
                        </span>
                        <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                            {total.toLocaleString()}
                        </div>
                    </div>

                    {/* Verified */}
                    <div className="p-4 sm:px-6 sm:py-4">
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Verified
                        </span>
                        <div className="text-2xl font-bold text-emerald-800 tracking-tight tabular-nums">
                            {verified.toLocaleString()}
                        </div>
                    </div>

                    {/* Flagged */}
                    <div className="p-4 sm:px-6 sm:py-4">
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Flagged
                        </span>
                        <div className={`text-2xl font-bold tracking-tight tabular-nums ${flagged > 0 ? 'text-amber-900' : 'text-gray-900'}`}>
                            {flagged.toLocaleString()}
                        </div>
                    </div>

                    {/* Modules Represented */}
                    <div className="p-4 sm:px-6 sm:py-4">
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Modules Represented
                        </span>
                        <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                            {modules.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
