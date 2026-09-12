import React, { useState, useMemo } from 'react';
import {
    FileText,
    ArrowRight,
    CheckCircle2,
    Layers,
    Clock,
    User as UserIcon,
    Shield,
    Hash,
} from 'lucide-react';
import { TransactionAuditRecord, AuditChildEvent } from '../types';
import { TransactionAuditStatus } from './TransactionAuditStatus';
import { AuditMetadataDetails } from './AuditMetadataDetails';
import {
    getAuditSecondaryText,
    formatAuditFieldLabel,
    formatAuditValue,
    isJsonString,
    parseAuditMetadata,
} from '../../utils/auditMetadata';

interface TransactionAuditExpandedDetailsProps {
    record: TransactionAuditRecord;
    formatDate: (isoString?: string | null) => string;
}

export const TransactionAuditExpandedDetails: React.FC<TransactionAuditExpandedDetailsProps> = ({
    record,
    formatDate,
}) => {
    const children = record.children || [];
    const reference = record.reference || record.resource_ref || '—';

    // Extract clean secondary subtitle text (never raw JSON)
    const secondaryText = useMemo(() => {
        return getAuditSecondaryText(record);
    }, [record]);

    // Group child events by affected record/item if identifiable, or provide clean listing
    const affectedItemGroups = useMemo(() => {
        const groups: Record<string, { title: string; subtitle?: string; events: AuditChildEvent[] }> = {};

        children.forEach((child) => {
            let groupKey = 'general';
            let title = 'General Technical Operation';
            let subtitle: string | undefined;

            const details = child.details || '';

            // Detect item-specific actions
            if (
                child.subject_type === 'IssuanceItem' ||
                child.subject_type === 'InventoryBatch' ||
                child.subject_type === 'Item'
            ) {
                const itemMatch = details.match(/['"]([^'"]+)['"]/);
                if (itemMatch) {
                    groupKey = itemMatch[1];
                    title = itemMatch[1];
                } else if (child.subject_id) {
                    groupKey = `${child.subject_type}-${child.subject_id}`;
                    title = `${child.subject_type} #${child.subject_id}`;
                } else {
                    groupKey = 'inventory-movement';
                    title = 'Inventory Movement';
                }
            } else if (child.subject_type) {
                groupKey = child.subject_type;
                title = child.subject_type;
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    title,
                    subtitle,
                    events: [],
                };
            }

            groups[groupKey].events.push(child);
        });

        return groups;
    }, [children]);

    const hasItemGroups =
        Object.keys(affectedItemGroups).length > 0 &&
        !(Object.keys(affectedItemGroups).length === 1 && affectedItemGroups['general']);

    return (
        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-5 text-xs text-gray-800">
            {/* LEVEL 1: TRANSACTION SUMMARY */}
            <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-red-50 text-red-900 rounded border border-red-100">
                            <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                            Level 1 • Transaction Summary
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <TransactionAuditStatus
                            status={record.audit_status}
                            result={record.result}
                        />
                        <span className="font-mono text-gray-400 text-[11px]">
                            ID: {record.id}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3">
                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <span className="text-gray-500 text-[11px] block font-medium flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-gray-400" />
                            Reference Identifier
                        </span>
                        <span className="font-mono font-bold text-gray-900 mt-1 block">
                            {reference}
                        </span>
                        {record.audit_group_id && (
                            <span
                                className="font-mono text-[10px] text-gray-500 block mt-0.5 truncate"
                                title={record.audit_group_id}
                            >
                                Group: {record.audit_group_id}
                            </span>
                        )}
                    </div>

                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <span className="text-gray-500 text-[11px] block font-medium flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-gray-400" />
                            Authorized User
                        </span>
                        <span className="font-bold text-gray-900 mt-1 block truncate">
                            {record.user_name || record.user || 'System Administrator'}
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                            {record.role || 'Authorized Role'}
                        </span>
                    </div>

                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <span className="text-gray-500 text-[11px] block font-medium flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-gray-400" />
                            Module & Business Action
                        </span>
                        <span className="font-bold text-gray-900 mt-1 block truncate">
                            {record.action}
                        </span>
                        <span className="text-[10px] text-red-950 font-medium block mt-0.5">
                            {record.module}
                        </span>
                    </div>

                    <div className="bg-gray-50/70 p-2.5 rounded border border-gray-100">
                        <span className="text-gray-500 text-[11px] block font-medium flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            Recorded Date & Time
                        </span>
                        <span className="font-medium text-gray-900 mt-1 block">
                            {formatDate(record.occurred_at || record.time)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                            Official Audit Timestamp
                        </span>
                    </div>
                </div>

                {secondaryText && (
                    <div className="mt-2.5 px-3 py-1.5 bg-red-50/40 rounded border border-red-100 text-xs text-red-950 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                        <span>{secondaryText}</span>
                    </div>
                )}
            </div>

            {/* PRIMARY TRANSACTION DETAILS & AUDIT METADATA (Requirements 1 - 7, 13 - 26) */}
            <div className="pt-1">
                <AuditMetadataDetails
                    record={record}
                    metadata={record.metadata}
                    oldValues={record.old_values}
                    newValues={record.new_values}
                    actionDescription={record.details}
                    eventKey={record.event_key}
                    showSummaryBanner={true}
                />
            </div>

            {/* LEVEL 2: AFFECTED RECORDS / ENTITY ALLOCATIONS (Optional grouping) */}
            {hasItemGroups ? (
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="p-1 bg-amber-50 text-amber-900 rounded border border-amber-100">
                            <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                            Affected Records & Entity Allocations
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        {Object.entries(affectedItemGroups).map(([groupKey, group]) => (
                            <div
                                key={groupKey}
                                className="bg-gray-50/60 rounded-md border border-gray-200 p-3 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 text-xs">
                                        {group.title}
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                                        {group.events.length} technical event{group.events.length === 1 ? '' : 's'}
                                    </span>
                                </div>

                                <ul className="space-y-1.5 text-[11px] text-gray-600 divide-y divide-gray-100 pt-1">
                                    {group.events.map((evt) => (
                                        <li key={evt.id} className="pt-1.5 flex items-start gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium text-gray-800 block">
                                                    {evt.label || evt.action}
                                                </span>
                                                {evt.details && !isJsonString(evt.details) && (
                                                    <span className="text-gray-500 text-[10px] block leading-tight mt-0.5">
                                                        {evt.details}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* LEVEL 3: TECHNICAL AUDIT TRAIL (Child events if present) */}
            {children.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-50 text-blue-900 rounded border border-blue-100">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                                Technical Audit Trail ({children.length} Events)
                            </span>
                        </div>
                    </div>

                    <div className="pt-3 space-y-2.5">
                        {children.map((child, idx) => {
                            const hasDiff =
                                child.old_values &&
                                child.new_values &&
                                Object.keys(child.new_values).length > 0;

                            // Format child details cleanly if it was stored as JSON
                            let childDisplayDetails = child.details;
                            if (child.details && isJsonString(child.details)) {
                                const parsed = parseAuditMetadata(child.details);
                                if (parsed) {
                                    childDisplayDetails = Object.entries(parsed)
                                        .map(
                                            ([k, v]) =>
                                                `${formatAuditFieldLabel(k)}: ${formatAuditValue(k, v).text}`
                                        )
                                        .join(' • ');
                                }
                            }

                            return (
                                <div
                                    key={child.id || idx}
                                    className="p-3 bg-gray-50/50 rounded-md border border-gray-200 space-y-2 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 text-[10px] font-bold text-gray-700">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-gray-900 text-xs">
                                                {child.label || child.action}
                                            </span>
                                            {child.event_key && (
                                                <span className="hidden sm:inline-block font-mono text-[10px] text-gray-500 px-1.5 py-0.5 bg-white rounded border border-gray-200">
                                                    {child.event_key}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {formatDate(child.occurred_at)}
                                        </span>
                                    </div>

                                    {childDisplayDetails && (
                                        <p className="text-xs text-gray-700 leading-relaxed font-sans pl-7">
                                            {childDisplayDetails}
                                        </p>
                                    )}

                                    {/* Structured Before / After Diffs */}
                                    {hasDiff && (
                                        <div className="pl-7 pt-1">
                                            <div className="flex flex-wrap gap-2 text-[11px]">
                                                {Object.entries(child.new_values || {}).map(
                                                    ([key, newVal]) => {
                                                        const oldVal = child.old_values?.[key];
                                                        const oldStr =
                                                            typeof oldVal === 'object'
                                                                ? JSON.stringify(oldVal)
                                                                : String(oldVal ?? '—');
                                                        const newStr =
                                                            typeof newVal === 'object'
                                                                ? JSON.stringify(newVal)
                                                                : String(newVal ?? '—');

                                                        if (oldStr === newStr) return null;

                                                        return (
                                                            <div
                                                                key={key}
                                                                className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200 text-xs"
                                                            >
                                                                <span className="font-semibold text-gray-600">
                                                                    {formatAuditFieldLabel(key)}:
                                                                </span>
                                                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-100 font-medium line-through">
                                                                    {oldStr}
                                                                </span>
                                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-bold">
                                                                    {newStr}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
