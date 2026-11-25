import { formatTimestamp } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Laptop, Copy, Check, Calendar, Globe, User } from 'lucide-react';
import { LoginAuditRecord } from '../types';
import { LoginAuditStatus } from './LoginAuditStatus';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type LoginSortKey = 'user' | 'role' | 'date' | 'ip' | 'result';

interface LoginAuditTableProps {
    coordinatorLayout?: boolean;
    records: LoginAuditRecord[];
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
    sort: LoginSortKey;
    direction: 'asc' | 'desc';
    onSort: (sort: LoginSortKey) => void;
}

const formatDisplayDate = formatTimestamp;

export const LoginAuditTable: React.FC<LoginAuditTableProps> = ({
    coordinatorLayout = false,
    records,
    hasActiveFilters = false,
    onResetFilters,
    sort,
    direction,
    onSort,
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
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/40 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                No authentication records match the selected filters.
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Please adjust your search keyword, role, status, or date range to inspect other records.
                            </p>
                            {onResetFilters && (
                                <Button variant="secondary"
                                    type="button"
                                    onClick={onResetFilters}
                                    className=""
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                No login audit records are available.
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Authentic authentication activity will automatically appear here as system users log in.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden ${coordinatorLayout ? "rounded-xl shadow-sm [&_td]:py-5 [&_th]:py-3.5" : "rounded-lg shadow-sm"}`}>
            <div className="w-full min-w-0 overflow-x-auto">
                <table className="ui-data-table w-full text-left border-collapse min-w-[53rem]">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-sm font-semibold text-slate-600 dark:text-slate-300 normal-case tracking-normal">
                            <th className="py-3 px-3 w-8 align-middle" aria-label="Expand or collapse row"></th>
                            <SortableTableHeader column="user" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[12.5rem] align-middle">User Details</SortableTableHeader>
                            <SortableTableHeader column="role" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[8.75rem] align-middle">Access Role</SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[10rem] align-middle">Date &amp; Time</SortableTableHeader>
                            <SortableTableHeader column="ip" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[8.125rem] align-middle">IP Address</SortableTableHeader>
                            <SortableTableHeader column="result" activeColumn={sort} direction={direction} onSort={onSort} align="center" className="py-3 px-4 whitespace-nowrap min-w-[7.5rem] align-middle">Result</SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
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
                                        className={`hover:bg-red-50/20 dark:hover:bg-red-950/20 cursor-pointer transition-colors group ${isExpanded ? "bg-red-50/30 dark:bg-red-950/20" : ""}`}
                                    >
                                        <td className="py-3.5 px-3 text-center align-middle">
                                            <Button variant="secondary"
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleRow(record.id);
                                                }}
                                                className=""
                                                aria-label={isExpanded ? 'Collapse audit details' : 'Expand audit details'}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-red-900 dark:text-red-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                )}
                                            </Button>
                                        </td>
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-950 dark:group-hover:text-red-300 transition-colors">
                                                    {displayName}
                                                </span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                                                    {displayEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 align-middle">
                                            {displayRole !== '—' ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${displayRole.toLowerCase().includes('admin')
    ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                                                    {displayRole}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium tabular-nums align-middle">
                                            {formattedDate}
                                        </td>
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="inline-flex items-center gap-1.5">
                                                <span className="tabular-nums text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 px-2 py-0.5 rounded shadow-sm">
                                                    {rawIp}
                                                </span>
                                                {rawIp !== '—' && (
                                                    <Button variant="secondary"
                                                        type="button"
                                                        onClick={(e) => handleCopyIp(e, rawIp)}
                                                        className=""
                                                        title="Copy IP address"
                                                    >
                                                        {copiedIp === rawIp ? (
                                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center align-middle">
                                            <LoginAuditStatus event={record.event || record.status || 'login_success'} />
                                        </td>
                                    </tr>

                                    {/* Expandable row with verified technical details */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                        <Laptop className="w-4 h-4 text-red-900 dark:text-red-400" />
                                                        <span>Authentication Audit Forensics (Record #{record.id})</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">Account Mapping</span>
                                                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                                {record.user_id ? (
                                                                    <>User ID: <span className="tabular-nums font-semibold text-red-900 dark:text-red-400">#{record.user_id}</span></>
                                                                ) : (
                                                                    <span className="italic text-slate-500 dark:text-slate-400">Unmatched / Non-system account</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">Source IP</span>
                                                            <span className="tabular-nums text-slate-900 dark:text-slate-100 font-medium">{rawIp}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">Canonical Event</span>
                                                            <span className="tabular-nums text-slate-800 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                {record.event}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block mb-1">
                                                            Client User Agent
                                                        </span>
                                                        <div className="tabular-nums text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200/80 dark:border-slate-800 break-all leading-relaxed select-all">
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
