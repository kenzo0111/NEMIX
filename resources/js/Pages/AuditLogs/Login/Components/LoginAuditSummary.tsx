import React from 'react';
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Login Audit Summary
                </h3>
                {hasActiveFilters && (
                    <span className="text-[11px] font-medium text-gray-500">
                        Summary reflected for current filter scope
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                <div className="p-4 sm:px-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Records</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {total.toLocaleString()}
                    </p>
                </div>

                <div className="p-4 sm:px-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Successful</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                        {successful.toLocaleString()}
                    </p>
                </div>

                <div className="p-4 sm:px-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Failed</p>
                    <p className={`text-xl sm:text-2xl font-bold mt-1 ${failed > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                        {failed.toLocaleString()}
                    </p>
                </div>

                <div className="p-4 sm:px-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unique Users</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {uniqueUsers.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};
