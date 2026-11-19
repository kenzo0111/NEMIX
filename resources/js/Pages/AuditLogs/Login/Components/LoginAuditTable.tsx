import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React, { useEffect, useState } from 'react';
import { Shield, Laptop, Copy, Check, Calendar, Globe, User } from 'lucide-react';
import { LoginAuditRecord } from '../types';
import { LoginAuditStatus } from './LoginAuditStatus';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import RecordDetailsModal from '@/Components/ui/record-details-modal';

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
    coordinatorLayout = false,
    records,
    hasActiveFilters = false,
    onResetFilters,
    sort,
    direction,
    onSort,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
    const [copiedIp, setCopiedIp] = useState<string | null>(null);

    const selectedRecord = records.find((record) => record.id === selectedRowId) || null;
    useEffect(() => {
        if (selectedRowId !== null && !records.some((record) => record.id === selectedRowId)) {
            setSelectedRowId(null);
            setShowDetails(false);
        }
    }, [records, selectedRowId]);

    const handleCopyIp = (e: React.MouseEvent, ip: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(ip);
        setCopiedIp(ip);
        setTimeout(() => setCopiedIp(null), 2000);
    };

    if (records.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-12 text-center shadow-2xs">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/40 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">
                                No authentication records match the selected filters.
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Please adjust your search keyword, role, status, or date range to inspect other records.
                            </p>
                            {onResetFilters && (
                                <button
                                    type="button"
                                    onClick={onResetFilters}
                                    className="px-3.5 py-1.5 text-sm font-semibold text-red-900 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/60 rounded-md transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">
                                No login audit records are available.
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                                Authentic authentication activity will automatically appear here as system users log in.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 overflow-hidden ${coordinatorLayout ? 'rounded-xl shadow-sm [&_td]:py-5 [&_th]:py-3.5' : 'rounded-lg shadow-2xs'}`}>
            <TableSelectionAction
                selectedLabel={selectedRecord ? (selectedRecord.user_name || selectedRecord.email || `Record #${selectedRecord.id}`) : null}
                actionLabel="View selected"
                onAction={() => setShowDetails(true)}
            />
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/80 text-sm font-bold text-gray-600 dark:text-slate-300 normal-case tracking-normal">
                            <SortableTableHeader column="user" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4">User Details</SortableTableHeader>
                            <SortableTableHeader column="role" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4">Access Role</SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4">Date &amp; Time</SortableTableHeader>
                            <SortableTableHeader column="ip" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4">IP Address</SortableTableHeader>
                            <SortableTableHeader column="result" activeColumn={sort} direction={direction} onSort={onSort} align="center" className="py-3 px-4">Result</SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                        {records.map((record) => {
                            const isUnknown = !record.user_id && record.event === 'login_failed';
                            const displayName = record.user_name || (isUnknown ? 'Unknown User' : '—');
                            const displayEmail = record.email || '—';
                            const displayRole = record.role || '—';
                            const rawIp = record.ip_address || record.ip || '—';
                            const formattedDate = formatDisplayDate(record.occurred_at || record.time);

                            return (
                                <React.Fragment key={record.id}>
                                    <tr
                                        
                                        
                                        {...rowSelectionProps(selectedRowId === record.id, () => { setSelectedRowId(record.id); setShowDetails(false); })}
                                        
                                        className={`hover:bg-red-50/20 dark:hover:bg-red-950/20 cursor-pointer transition-colors group ${
                                            selectedRowId === record.id ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : ''
                                        }`}
                                    >
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-red-950 dark:group-hover:text-red-300 transition-colors">
                                                    {displayName}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-slate-400 font-normal">
                                                    {displayEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {displayRole !== '—' ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${
                                                    displayRole.toLowerCase().includes('admin')
                                                        ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    {displayRole}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-slate-500 font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-700 dark:text-slate-300 font-medium tabular-nums">
                                            {formattedDate}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="inline-flex items-center gap-1.5">
                                                <span className="tabular-nums text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">
                                                    {rawIp}
                                                </span>
                                                {rawIp !== '—' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCopyIp(e, rawIp)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded transition-opacity"
                                                        title="Copy IP address"
                                                    >
                                                        {copiedIp === rawIp ? (
                                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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

                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <RecordDetailsModal show={showDetails && !!selectedRecord} title="Authentication audit details" onClose={() => setShowDetails(false)}>
                {selectedRecord && <div className="space-y-5">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[
                        ['Record', String(selectedRecord.id)], ['Account', selectedRecord.user_name || selectedRecord.email || 'Unknown User'],
                        ['Account mapping', selectedRecord.user_id ? 'User ID: #' + selectedRecord.user_id : 'Unmatched / Non-system account'],
                        ['Access role', selectedRecord.role || '—'], ['Source IP', selectedRecord.ip_address || selectedRecord.ip || '—'],
                        ['Canonical event', selectedRecord.event || selectedRecord.status || '—'], ['Date and time', formatDisplayDate(selectedRecord.occurred_at || selectedRecord.time)],
                    ].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>
                    <div><h3 className="text-sm font-semibold">Client User Agent</h3><p className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-950">{selectedRecord.user_agent || 'Client user agent was not recorded for this event.'}</p></div>
                </div>}
            </RecordDetailsModal>
        </div>
    );
};
