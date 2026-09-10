import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Laptop, Info } from 'lucide-react';
import { LoginAuditRecord } from '../types';
import { LoginAuditStatus } from './LoginAuditStatus';

interface LoginAuditTableProps {
    records: LoginAuditRecord[];
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
}

const formatDisplayDate = (isoString?: string | null): string => {
    if (!isoString) {
        return '—';
    }

    try {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return isoString;
        }

        const datePart = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        const timePart = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        return `${datePart} • ${timePart}`;
    } catch {
        return 'Timestamp unavailable';
    }
};

export const LoginAuditTable: React.FC<LoginAuditTableProps> = ({
    records,
    hasActiveFilters = false,
    onResetFilters,
}) => {
    const [expandedRowId, setExpandedRowId] = useState<number | string | null>(null);

    const toggleRow = (id: number | string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
    };

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                                No authentication records match the selected filters.
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Adjust your search terms, role selection, status, or date range to view records.
                            </p>
                            {onResetFilters && (
                                <button
                                    type="button"
                                    onClick={onResetFilters}
                                    className="px-3.5 py-2 text-xs font-semibold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                                No login audit records are available.
                            </h4>
                            <p className="text-xs text-gray-500">
                                Authentication activity will automatically be recorded here as users sign in.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                            <th className="py-3 px-4 w-8"></th>
                            <th className="py-3 px-4">User Details</th>
                            <th className="py-3 px-4">Access Role</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">IP Address</th>
                            <th className="py-3 px-4 text-center">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                        {records.map((record) => {
                            const isExpanded = expandedRowId === record.id;
                            const isUnknown = !record.user_id && record.event === 'login_failed';
                            const displayName = record.user_name || (isUnknown ? 'Unknown User' : '—');
                            const displayEmail = record.email || '—';
                            const displayRole = record.role || '—';
                            const formattedDate = formatDisplayDate(record.occurred_at || record.time);

                            return (
                                <React.Fragment key={record.id}>
                                    <tr
                                        onClick={() => toggleRow(record.id)}
                                        className={`hover:bg-red-50/20 cursor-pointer transition-colors ${
                                            isExpanded ? 'bg-red-50/30' : ''
                                        }`}
                                    >
                                        <td className="py-3.5 px-3 text-gray-400 text-center">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-gray-600 inline" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">
                                                    {displayName}
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                    {displayEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-700">
                                            {displayRole}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                                            {formattedDate}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded inline-block">
                                                {record.ip_address || record.ip || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <LoginAuditStatus event={record.event || record.status || 'login_success'} />
                                        </td>
                                    </tr>

                                    {/* Expandable row with verified technical details */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/70 border-b border-gray-200">
                                            <td colSpan={6} className="px-6 py-3.5">
                                                <div className="flex items-start gap-3 text-xs text-gray-700">
                                                    <Laptop className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                            <span className="font-semibold text-gray-900">Audit Record #{record.id}</span>
                                                            {record.user_id && (
                                                                <span className="text-gray-500">
                                                                    User Account ID: <span className="font-mono">{record.user_id}</span>
                                                                </span>
                                                            )}
                                                            <span className="text-gray-500">
                                                                Source IP: <span className="font-mono">{record.ip_address || record.ip || '—'}</span>
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-600">
                                                            <span className="font-semibold text-gray-700">Client User Agent: </span>
                                                            {record.user_agent ? (
                                                                <span className="font-mono text-[11px] text-gray-600 break-all">{record.user_agent}</span>
                                                            ) : (
                                                                <span className="italic text-gray-400">User agent not recorded</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
