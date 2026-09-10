import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { TransactionAuditRecord } from '../types';
import { TransactionAuditStatus } from './TransactionAuditStatus';

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

/**
 * Checks if details string contains before/after change context (e.g. 'Live Production → Maintenance Mode')
 */
const parseChangeContext = (text?: string | null): { before: string; after: string } | null => {
    if (!text) return null;

    if (text.includes('→')) {
        const parts = text.split('→');
        if (parts.length === 2) {
            return {
                before: parts[0].trim(),
                after: parts[1].trim(),
            };
        }
    }

    // Check for 'from "A" to "B"' pattern
    const fromToMatch = text.match(/from\s+['"]([^'"]+)['"]\s+to\s+['"]([^'"]+)['"]/i);
    if (fromToMatch) {
        return {
            before: fromToMatch[1].trim(),
            after: fromToMatch[2].trim(),
        };
    }

    return null;
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
                                Please adjust your search keyword, module, action, or date range to inspect other records.
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
                                Recorded system transactions, inventory movements, and administrative activities will automatically appear here.
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
                        <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                            <th className="py-3 px-4 w-10"></th>
                            <th className="py-3 px-4 w-1/4">User</th>
                            <th className="py-3 px-4 w-1/3">Activity</th>
                            <th className="py-3 px-4 w-1/6">Module</th>
                            <th className="py-3 px-4 w-28">Status</th>
                            <th className="py-3 px-4 w-44">Date & Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                        {records.map((record, index) => {
                            const isExpanded = expandedRowId === record.id;
                            const changeContext = parseChangeContext(record.details);
                            const reference = record.reference || record.resource_ref;

                            return (
                                <React.Fragment key={record.id || index}>
                                    <tr
                                        onClick={() => toggleRow(record.id)}
                                        className={`cursor-pointer transition-colors ${
                                            isExpanded ? 'bg-red-50/30' : 'hover:bg-gray-50/80'
                                        }`}
                                    >
                                        {/* Expand Toggle */}
                                        <td className="py-3.5 px-4 text-gray-400 text-center">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-red-900" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                        </td>

                                        {/* User & Role (No Avatar) */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900">
                                                {record.user_name || record.user || '—'}
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                {record.role || '—'}
                                            </div>
                                        </td>

                                        {/* Activity & Details */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900">
                                                {record.action || 'Action unavailable'}
                                            </div>
                                            {record.details && (
                                                <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                                    {reference && (
                                                        <span className="font-mono font-medium text-gray-700 mr-1.5">
                                                            {reference}
                                                            {record.details.toLowerCase().includes(reference.toLowerCase()) ? '' : ' •'}
                                                        </span>
                                                    )}
                                                    {record.details}
                                                </div>
                                            )}
                                        </td>

                                        {/* Module */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs text-gray-700 font-medium">
                                                {record.module || 'Module unavailable'}
                                            </span>
                                        </td>

                                        {/* Audit Status */}
                                        <td className="py-3.5 px-4">
                                            <TransactionAuditStatus
                                                status={record.audit_status}
                                                result={record.result}
                                            />
                                        </td>

                                        {/* Date & Time (Standard font, no mono) */}
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                                            {formatDisplayDate(record.occurred_at || record.time)}
                                        </td>
                                    </tr>

                                    {/* Expanded Audit Details Panel */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/60">
                                            <td colSpan={6} className="px-6 py-4 border-t border-gray-100">
                                                <div className="p-4 bg-white border border-gray-200 rounded-md shadow-2xs space-y-3">
                                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-red-900" />
                                                            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                                                Transaction Audit Details
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-500">
                                                            ID: {record.id}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Reference
                                                            </span>
                                                            <span className="font-mono font-semibold text-gray-900">
                                                                {reference || '—'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Authorized User
                                                            </span>
                                                            <span className="font-semibold text-gray-900">
                                                                {record.user_name || record.user || '—'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Assigned Role
                                                            </span>
                                                            <span className="font-medium text-gray-800">
                                                                {record.role || 'Role unavailable'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Module
                                                            </span>
                                                            <span className="font-medium text-gray-900">
                                                                {record.module || 'Module unavailable'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Action Performed
                                                            </span>
                                                            <span className="font-semibold text-gray-900">
                                                                {record.action || 'Action unavailable'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <span className="text-gray-500 text-[11px] block font-medium">
                                                                Audit Timestamp
                                                            </span>
                                                            <span className="font-medium text-gray-700">
                                                                {formatDisplayDate(record.occurred_at || record.time)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Change Context / Before & After Visualization */}
                                                    {changeContext && (
                                                        <div className="pt-2 border-t border-gray-100">
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                                                                Recorded Change Context
                                                            </span>
                                                            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                                                                <span className="px-2 py-1 bg-white border border-gray-200 rounded font-medium text-gray-700">
                                                                    {changeContext.before}
                                                                </span>
                                                                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="px-2 py-1 bg-red-50 border border-red-200 rounded font-semibold text-red-950">
                                                                    {changeContext.after}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Full Details Text */}
                                                    {record.details && !changeContext && (
                                                        <div className="pt-2 border-t border-gray-100">
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                                                                Details
                                                            </span>
                                                            <p className="text-xs text-gray-700 leading-relaxed font-sans bg-gray-50/60 p-2.5 rounded border border-gray-200">
                                                                {record.details}
                                                            </p>
                                                        </div>
                                                    )}
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
