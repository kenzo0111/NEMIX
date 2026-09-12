import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { TransactionAuditRecord } from '../types';
import { TransactionAuditStatus } from './TransactionAuditStatus';
import { TransactionAuditExpandedDetails } from './TransactionAuditExpandedDetails';

interface TransactionAuditTableProps {
    records: TransactionAuditRecord[];
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

export const TransactionAuditTable: React.FC<TransactionAuditTableProps> = ({
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
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-2xs">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-red-50 text-red-900 border border-red-100 rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                    </div>
                    {hasActiveFilters ? (
                        <>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                                No transaction records match the selected filters.
                            </h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Please adjust your search keyword, module, action, date range, or view mode to inspect other records.
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
                                No transaction audit records are available.
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Recorded business transactions, stock movements, and administrative activities will automatically appear here.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-2xs overflow-hidden w-full min-w-0">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                            <th className="py-3 px-3 w-12 text-center" aria-label="Expand or collapse row"></th>
                            <th className="py-3 px-4 w-1/4">User</th>
                            <th className="py-3 px-4 w-1/3">Activity</th>
                            <th className="py-3 px-4 w-1/6">Module</th>
                            <th className="py-3 px-4 w-28">Result</th>
                            <th className="py-3 px-4 w-44">Date & Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                        {records.map((record, index) => {
                            const isExpanded = expandedRowId === record.id;
                            const childrenCount = record.children?.length || 0;
                            const secondaryText = record.secondary_line || record.details;

                            return (
                                <React.Fragment key={record.id || index}>
                                    <tr
                                        onClick={() => toggleRow(record.id)}
                                        className={`cursor-pointer transition-colors ${
                                            isExpanded ? 'bg-red-50/25' : 'hover:bg-gray-50/80'
                                        }`}
                                    >
                                        {/* Expand Toggle Button with Accessibility */}
                                        <td className="py-3 px-3 text-center">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleRow(record.id);
                                                }}
                                                aria-expanded={isExpanded}
                                                aria-label={isExpanded ? 'Collapse audit details' : 'View audit details'}
                                                className="p-1 rounded hover:bg-gray-200/60 focus:outline-none focus:ring-1 focus:ring-red-900 transition-colors inline-flex items-center justify-center text-gray-500"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-red-900" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </td>

                                        {/* USER */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900 leading-tight truncate">
                                                {record.user_name || record.user || 'System Administrator'}
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5 leading-tight truncate">
                                                {record.role || 'System Role'}
                                            </div>
                                        </td>

                                        {/* ACTIVITY (Primary bold title + Secondary subtitle) */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 leading-tight">
                                                    {record.action || 'Action unavailable'}
                                                </span>
                                                {childrenCount > 0 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                        {childrenCount} {childrenCount === 1 ? 'event' : 'events'}
                                                    </span>
                                                )}
                                            </div>
                                            {secondaryText && (
                                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight line-clamp-1">
                                                    {secondaryText}
                                                </div>
                                            )}
                                        </td>

                                        {/* MODULE (Normalized, Plain text) */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs text-gray-700 font-medium">
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
                                        <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                                            {formatDisplayDate(record.occurred_at || record.time)}
                                        </td>
                                    </tr>

                                    {/* EXPANDED DETAILS */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/40">
                                            <td colSpan={6} className="px-4 sm:px-6 py-4 border-t border-gray-100">
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
