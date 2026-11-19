import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { TransactionAuditRecord } from '../types';
import { TransactionAuditStatus } from './TransactionAuditStatus';
import { TransactionAuditExpandedDetails } from './TransactionAuditExpandedDetails';
import { getAuditSecondaryText } from '../../utils/auditMetadata';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import TableSelectionAction from '@/Components/ui/table-selection-action';
import RecordDetailsModal from '@/Components/ui/record-details-modal';

type TransactionSortKey = 'user' | 'activity' | 'module' | 'result' | 'date';

interface TransactionAuditTableProps {
    records: TransactionAuditRecord[];
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
    sort: TransactionSortKey;
    direction: 'asc' | 'desc';
    onSort: (sort: TransactionSortKey) => void;
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

export const TransactionAuditTable: React.FC<TransactionAuditTableProps> = ({
    records,
    hasActiveFilters = false,
    onResetFilters,
    sort,
    direction,
    onSort,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
    const selectedRecord = records.find((record) => record.id === selectedRowId) || null;

    useEffect(() => {
        if (selectedRowId !== null && !records.some((record) => record.id === selectedRowId)) {
            setSelectedRowId(null);
            setShowDetails(false);
        }
    }, [records, selectedRowId]);

    if (records.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-12 text-center shadow-2xs">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">
                                No transaction records match the selected filters.
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Please adjust your search keyword, module, action, date range, or view mode to inspect other records.
                            </p>
                            {onResetFilters && (
                                <button
                                    type="button"
                                    onClick={onResetFilters}
                                    className="px-3.5 py-1.5 text-sm font-semibold text-red-900 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/40 rounded-md transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <h4 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-1">
                                No transaction audit records are available.
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                                Recorded business transactions, stock movements, and administrative activities will automatically appear here.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200/90 dark:border-slate-800 shadow-2xs overflow-hidden w-full min-w-0">
            <TableSelectionAction
                selectedLabel={selectedRecord ? (selectedRecord.action || selectedRecord.reference || `Record #${selectedRecord.id}`) : null}
                actionLabel="View selected"
                onAction={() => setShowDetails(true)}
            />
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 text-sm font-bold text-gray-600 dark:text-slate-300 normal-case tracking-normal">
                            <SortableTableHeader column="user" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 w-1/4">User</SortableTableHeader>
                            <SortableTableHeader column="activity" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 w-1/3">Activity</SortableTableHeader>
                            <SortableTableHeader column="module" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 w-1/6">Module</SortableTableHeader>
                            <SortableTableHeader column="result" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 w-28">Result</SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 w-44">Date &amp; Time</SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-sm">
                        {records.map((record, index) => {
                            const childrenCount = record.children?.length || 0;
                            const secondaryText = getAuditSecondaryText(record);

                            return (
                                <React.Fragment key={record.id || index}>
                                    <tr
                                        
                                        
                                        {...rowSelectionProps(selectedRowId === record.id, () => { setSelectedRowId(record.id); setShowDetails(false); })}
                                        
                                        className={`cursor-pointer transition-colors ${
                                            selectedRowId === record.id ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'
                                        }`}
                                    >
                                        {/* USER */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900 dark:text-slate-100 leading-tight truncate">
                                                {record.user_name || record.user || 'System Administrator'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                                                {record.role || 'System Role'}
                                            </div>
                                        </td>

                                        {/* ACTIVITY (Primary bold title + Secondary subtitle) */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                                                    {record.action || 'Action unavailable'}
                                                </span>
                                                {childrenCount > 0 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                                        {childrenCount} {childrenCount === 1 ? 'event' : 'events'}
                                                    </span>
                                                )}
                                            </div>
                                            {secondaryText && (
                                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-1">
                                                    {secondaryText}
                                                </div>
                                            )}
                                        </td>

                                        {/* MODULE (Normalized, Plain text) */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                                                {record.module || 'System'}
                                            </span>
                                        </td>

                                        {/* RESULT */}
                                        <td className="py-3.5 px-4">
                                            <TransactionAuditStatus
                                                status={record.audit_status}
                                                result={record.result}
                                            />
                                        </td>

                                        {/* DATE & TIME */}
                                        <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                            {formatDisplayDate(record.occurred_at || record.time)}
                                        </td>
                                    </tr>

                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <RecordDetailsModal show={showDetails && !!selectedRecord} title="Transaction audit details" maxWidth="5xl" onClose={() => setShowDetails(false)}>
                {selectedRecord && <TransactionAuditExpandedDetails record={selectedRecord} formatDate={formatDisplayDate} />}
            </RecordDetailsModal>
        </div>
    );
};
