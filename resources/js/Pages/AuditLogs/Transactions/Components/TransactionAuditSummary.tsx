import React from 'react';
import { ScrollText, CheckCircle2, AlertTriangle, Layers, Filter } from 'lucide-react';
import StatCard from '@/Components/ui/stat-card';
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 rounded-md text-sm text-amber-800 dark:text-amber-300 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Summary counts reflect active filter parameters (Search / Module / Action / Date Range).</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Records"
                    value={total.toLocaleString('en-PH')}
                    sublabel="All recorded system activities"
                    icon={<ScrollText className="w-5 h-5" />}
                    tone="brand"
                />
                <StatCard
                    label="Verified Actions"
                    value={verified.toLocaleString('en-PH')}
                    sublabel="Approved system operations"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    tone="success"
                />
                <StatCard
                    label="Flagged Entries"
                    value={flagged.toLocaleString('en-PH')}
                    sublabel="Exceptions and warnings recorded"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    tone={flagged > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                    label="Modules Represented"
                    value={modules.toLocaleString('en-PH')}
                    sublabel="System operational areas"
                    icon={<Layers className="w-5 h-5" />}
                    tone="neutral"
                />
            </div>
        </div>
    );
};
