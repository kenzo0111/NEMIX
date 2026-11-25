import { formatTimestamp } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { TransactionAuditRecord } from '../types';
import { TransactionAuditStatus } from './TransactionAuditStatus';
import { TransactionAuditExpandedDetails } from './TransactionAuditExpandedDetails';
import { getAuditSecondaryText } from '../../utils/auditMetadata';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type TransactionSortKey = 'user' | 'activity' | 'module' | 'result' | 'date';

interface TransactionAuditTableProps {
    records: TransactionAuditRecord[];
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
    sort: TransactionSortKey;
    direction: 'asc' | 'desc';
    onSort: (sort: TransactionSortKey) => void;
}

const formatDisplayDate = formatTimestamp;

export const TransactionAuditTable: React.FC<TransactionAuditTableProps> = ({
    records,
    hasActiveFilters = false,
    onResetFilters,
    sort,
    direction,
    onSort,
}) => {
    const [expandedRowId, setExpandedRowId] = useState<number | string | null>(null);

    const toggleRow = (id: number | string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
    };

    if (records.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                No transaction records match the selected filters.
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Please adjust your search keyword, module, action, date range, or view mode to inspect other records.
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
                                No transaction audit records are available.
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Recorded business transactions, stock movements, and administrative activities will automatically appear here.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden w-full min-w-0">
            <div className="overflow-x-auto w-full min-w-0">
                <table className="ui-data-table w-full text-left border-collapse min-w-[53rem]">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-sm font-semibold text-slate-600 dark:text-slate-300 normal-case tracking-normal">
                            <th className="py-3 px-3 w-12 text-center align-middle" aria-label="Expand or collapse row"></th>
                            <SortableTableHeader column="user" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[11.25rem] align-middle">User</SortableTableHeader>
                            <SortableTableHeader column="activity" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[13.75rem] align-middle">Activity</SortableTableHeader>
                            <SortableTableHeader column="module" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[8.75rem] align-middle">Module</SortableTableHeader>
                            <SortableTableHeader column="result" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[7rem] align-middle">Result</SortableTableHeader>
                            <SortableTableHeader column="date" activeColumn={sort} direction={direction} onSort={onSort} className="py-3 px-4 whitespace-nowrap min-w-[10rem] align-middle">Date &amp; Time</SortableTableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {records.map((record, index) => {
                            const isExpanded = expandedRowId === record.id;
                            const childrenCount = record.children?.length || 0;
                            const secondaryText = getAuditSecondaryText(record);

                            return (
                                <React.Fragment key={record.id || index}>
                                    <tr
                                        onClick={() => toggleRow(record.id)}
                                        className={`cursor-pointer transition-colors ${isExpanded
    ? "bg-red-50/30 dark:bg-red-950/20" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"}`}
                                    >
                                        {/* EXPAND TOGGLE */}
                                        <td className="py-3.5 px-3 text-center align-middle">
                                            <Button variant="secondary"
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleRow(record.id);
                                                }}
                                                className=""
                                                aria-label={isExpanded ? 'Collapse transaction details' : 'Expand transaction details'}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-red-900 dark:text-red-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                )}
                                            </Button>
                                        </td>

                                        {/* USER */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                                {record.user_name || record.user || 'System Administrator'}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                                                {record.role || 'System Role'}
                                            </div>
                                        </td>

                                        {/* ACTIVITY (Primary bold title + Secondary subtitle) */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                                    {record.action || 'Action unavailable'}
                                                </span>
                                                {childrenCount > 0 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        {childrenCount} {childrenCount === 1 ? 'event' : 'events'}
                                                    </span>
                                                )}
                                            </div>
                                            {secondaryText && (
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-1">
                                                    {secondaryText}
                                                </div>
                                            )}
                                        </td>

                                        {/* MODULE */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                {record.module || 'System'}
                                            </span>
                                        </td>

                                        {/* RESULT */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <TransactionAuditStatus
                                                status={record.audit_status}
                                                result={record.result}
                                            />
                                        </td>

                                        {/* DATE & TIME */}
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap align-middle">
                                            {formatDisplayDate(record.occurred_at || record.time)}
                                        </td>
                                    </tr>

                                    {/* EXPANDED DETAILS */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50/40 dark:bg-slate-950/40">
                                            <td colSpan={6} className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                                                <TransactionAuditExpandedDetails
                                                    record={record}
                                                    formatDate={formatDisplayDate}
                                                />
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
