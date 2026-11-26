import React from 'react';
import { ScrollText, CheckCircle2, AlertOctagon, Users2, Filter } from 'lucide-react';
import StatCard from '@/Components/ui/stat-card';
import { LoginAuditSummary as SummaryData } from '../types';

interface LoginAuditSummaryProps {
    summary: SummaryData;
    hasActiveFilters?: boolean;
    coordinatorLayout?: boolean;
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
        <section aria-label="Authentication activity overview" className="space-y-3">
            {hasActiveFilters && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-md text-sm text-amber-800 dark:text-amber-300 font-medium">
                    <Filter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Summary counts reflect active filter parameters (Search / Role / Status / Date Range).</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Records"
                    value={total.toLocaleString('en-PH')}
                    sublabel="All recorded authentication attempts"
                    icon={<ScrollText className="w-5 h-5" />}
                    tone="brand"
                />
                <StatCard
                    label="Successful"
                    value={successful.toLocaleString('en-PH')}
                    sublabel="Authorized access sessions granted"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    tone="success"
                />
                <StatCard
                    label="Failed Logins"
                    value={failed.toLocaleString('en-PH')}
                    sublabel="Denied or unrecognized attempts"
                    icon={<AlertOctagon className="w-5 h-5" />}
                    tone={failed > 0 ? 'danger' : 'neutral'}
                />
                <StatCard
                    label="Unique Users"
                    value={uniqueUsers.toLocaleString('en-PH')}
                    sublabel="Distinct user identities recorded"
                    icon={<Users2 className="w-5 h-5" />}
                    tone="info"
                />
            </div>
        </section>
    );
};
