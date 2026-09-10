import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Laptop, Copy, Check, Calendar, Globe, User } from 'lucide-react';
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
    const [copiedIp, setCopiedIp] = useState<string | null>(null);

    const toggleRow = (id: number | string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
    };

    const handleCopyIp = (e: React.MouseEvent, ip: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(ip);
        setCopiedIp(ip);
        setTimeout(() => setCopiedIp(null), 2000);
    };

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-2xs">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 text-red-900 border border-red-100 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                                No authentication records match the selected filters.
                            </h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Please adjust your search keyword, role, status, or date range to inspect other records.
                            </p>
                            {onResetFilters && (
                                <button
                                    type="button"
                                    onClick={onResetFilters}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
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
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Authentic authentication activity will automatically appear here as system users log in.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                            <th className="py-3 px-3 w-8"></th>
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
                            const rawIp = record.ip_address || record.ip || '—';
                            const formattedDate = formatDisplayDate(record.occurred_at || record.time);

                            return (
                                <React.Fragment key={record.id}>
                                    <tr
                                        onClick={() => toggleRow(record.id)}
                                        className={`hover:bg-red-50/20 cursor-pointer transition-colors group ${
                                            isExpanded ? 'bg-red-50/30' : ''
                                        }`}
                                    >
                                        <td className="py-3.5 px-3 text-gray-400 text-center">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-red-900 inline transition-transform" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 inline transition-transform" />
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 group-hover:text-red-950 transition-colors">
                                                    {displayName}
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-normal">
                                                    {displayEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {displayRole !== '—' ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                    displayRole.toLowerCase().includes('admin')
                                                        ? 'bg-red-50 text-red-900 border-red-200'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                    {displayRole}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-700 font-medium tabular-nums">
                                            {formattedDate}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="inline-flex items-center gap-1.5">
                                                <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200/90 px-2 py-0.5 rounded shadow-2xs">
                                                    {rawIp}
                                                </span>
                                                {rawIp !== '—' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCopyIp(e, rawIp)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded transition-opacity"
                                                        title="Copy IP address"
                                                    >
                                                        {copiedIp === rawIp ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <LoginAuditStatus event={record.event || record.status || 'login_success'} />
                                        </td>
                                    </tr>

                                    {/* Expandable row with verified technical details */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/60 border-b border-gray-200">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="bg-white rounded-md border border-gray-200/80 p-3.5 shadow-2xs">
                                                    <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100 text-xs font-bold text-gray-700">
                                                        <Laptop className="w-4 h-4 text-red-900" />
                                                        <span>Authentication Audit Forensics (Record #{record.id})</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">Account Mapping</span>
                                                            <span className="text-gray-900 font-medium">
                                                                {record.user_id ? (
                                                                    <>User ID: <span className="font-mono font-bold text-red-900">#{record.user_id}</span></>
                                                                ) : (
                                                                    <span className="italic text-gray-500">Unmatched / Non-system account</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">Source IP</span>
                                                            <span className="font-mono text-gray-900 font-medium">{rawIp}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">Canonical Event</span>
                                                            <span className="font-mono text-gray-800 text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {record.event}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-2.5 border-t border-gray-100">
                                                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                                            Client User Agent
                                                        </span>
                                                        <div className="font-mono text-[11px] text-gray-700 bg-gray-50 p-2 rounded border border-gray-200/80 break-all leading-relaxed select-all">
                                                            {record.user_agent || 'Client user agent was not recorded for this event.'}
                                                        </div>
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
