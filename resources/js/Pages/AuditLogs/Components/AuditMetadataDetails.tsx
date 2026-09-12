import React, { useState, useMemo } from 'react';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AuditMetadata,
    TransactionAuditRecord,
} from '../Transactions/types';
import {
    parseAuditMetadata,
    sanitizeAuditMetadata,
    formatAuditFieldLabel,
    formatAuditValue,
    detectEventType,
    getIssuanceSummary,
    getBeforeAfterDiffs,
    isJsonString,
} from '../utils/auditMetadata';

export interface AuditMetadataDetailsProps {
    eventKey?: string | null;
    metadata?: AuditMetadata | string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    actionDescription?: string | null;
    record?: TransactionAuditRecord;
    className?: string;
    showSummaryBanner?: boolean;
}

export const AuditMetadataDetails: React.FC<AuditMetadataDetailsProps> = ({
    eventKey,
    metadata,
    oldValues,
    newValues,
    actionDescription,
    record,
    className = '',
    showSummaryBanner = true,
}) => {
    const [showRaw, setShowRaw] = useState(false);

    // 1. Safe parsing of metadata: parse once and sanitize sensitive data
    const parsedMetadata = useMemo(() => {
        let meta = parseAuditMetadata(metadata);

        // Fallback: If metadata was empty but actionDescription/details was a JSON string
        if (!meta && actionDescription && isJsonString(actionDescription)) {
            meta = parseAuditMetadata(actionDescription);
        }
        if (!meta && record?.details && isJsonString(record.details)) {
            meta = parseAuditMetadata(record.details);
        }

        return sanitizeAuditMetadata<AuditMetadata>(meta);
    }, [metadata, actionDescription, record?.details]);

    // 2. Safe sanitization for old and new values
    const sanitizedOld = useMemo(() => sanitizeAuditMetadata<Record<string, unknown>>(oldValues), [oldValues]);
    const sanitizedNew = useMemo(() => sanitizeAuditMetadata<Record<string, unknown>>(newValues), [newValues]);

    // 3. Before/After diffs
    const diffs = useMemo(() => {
        return getBeforeAfterDiffs(sanitizedOld, sanitizedNew, parsedMetadata?.diffs);
    }, [sanitizedOld, sanitizedNew, parsedMetadata?.diffs]);

    // 4. Detect event category
    const eventCategory = useMemo(() => {
        return detectEventType(eventKey || record?.event_key, parsedMetadata, record?.module, record?.action);
    }, [eventKey, record?.event_key, parsedMetadata, record?.module, record?.action]);

    // 5. Issuance summary banner info
    const issuanceSummary = useMemo(() => {
        if (eventCategory === 'issuance' && showSummaryBanner) {
            return getIssuanceSummary(parsedMetadata, record);
        }
        return null;
    }, [eventCategory, showSummaryBanner, parsedMetadata, record]);

    // 6. Action description: only render if it is human-readable and NOT raw JSON
    const cleanActionDescription = useMemo(() => {
        const text = actionDescription || record?.details;
        if (!text || isJsonString(text)) {
            return null;
        }
        return text;
    }, [actionDescription, record?.details]);

    // 7. Structured fields to display based on event type or general mapping
    const structuredFields = useMemo(() => {
        if (!parsedMetadata) return [];

        const items: Array<{
            key: string;
            label: string;
            value: string;
            isMonospace?: boolean;
            isCurrency?: boolean;
        }> = [];

        const seenKeys = new Set<string>();

        const addField = (key: string, labelOverride?: string) => {
            if (seenKeys.has(key)) return;
            if (key in parsedMetadata && parsedMetadata[key] !== undefined) {
                const val = parsedMetadata[key];
                // Don't render complex arrays/objects as simple field strings
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) return;
                if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') return;

                seenKeys.add(key);
                const formatted = formatAuditValue(key, val);
                items.push({
                    key,
                    label: labelOverride || formatAuditFieldLabel(key),
                    value: formatted.text,
                    isMonospace: formatted.isMonospace,
                    isCurrency: formatted.isCurrency,
                });
            }
        };

        // Event-specific ordered keys
        if (eventCategory === 'issuance') {
            addField('ris_number', 'RIS Number');
            addField('recipient', 'Recipient');
            addField('department', 'Department');
            addField('items_count', 'Items');
            addField('total_quantity', 'Total Quantity');
            addField('purpose', 'Purpose');
            addField('status', 'Status');
            addField('issuance_id', 'Issuance ID');
        } else if (eventCategory === 'receiving') {
            addField('receiving_reference', 'Receiving Reference');
            addField('item', 'Item');
            addField('item_name', 'Item');
            addField('supplier', 'Supplier');
            addField('supplier_name', 'Supplier');
            addField('supplier_stock_no', 'Supplier Stock No.');
            addField('quantity_received', 'Quantity Received');
            addField('quantity', 'Quantity Received');
            addField('unit_cost', 'Unit Cost');
            addField('batch_value', 'Batch Value');
            addField('total_cost', 'Batch Value');
            addField('batch_number', 'Batch Number');
            addField('expiry_date', 'Expiry Date');
            addField('receiving_id', 'Receiving ID');
        } else if (eventCategory === 'supplier') {
            addField('supplier', 'Supplier');
            addField('supplier_name', 'Supplier');
            addField('name', 'Supplier');
            addField('tin', 'TIN');
            addField('registration_number', 'Registration Number');
            addField('category', 'Category');
            addField('contact_person', 'Contact Person');
            addField('contact_number', 'Contact Number');
            addField('status', 'Status');
        } else if (eventCategory === 'compliance_report') {
            addField('report_type', 'Report Type');
            addField('report_reference', 'Report Reference');
            addField('period', 'Period');
            addField('supplier', 'Supplier');
            addField('records_included', 'Records Included');
            addField('title', 'Report Title');
        }

        // Add any remaining fields that have not been seen
        const ignoredKeys = new Set(['diffs', 'items', 'class', 'id', 'updated_keys']);
        for (const [key, val] of Object.entries(parsedMetadata)) {
            if (seenKeys.has(key) || ignoredKeys.has(key.toLowerCase())) continue;
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) continue;
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') continue;

            const formatted = formatAuditValue(key, val);
            items.push({
                key,
                label: formatAuditFieldLabel(key),
                value: formatted.text,
                isMonospace: formatted.isMonospace,
                isCurrency: formatted.isCurrency,
            });
            seenKeys.add(key);
        }

        return items;
    }, [parsedMetadata, eventCategory]);

    // 8. Extract nested items array if present (Requirement 16)
    const nestedItems = useMemo(() => {
        if (!parsedMetadata) return null;
        if (Array.isArray(parsedMetadata.items) && parsedMetadata.items.length > 0) {
            return parsedMetadata.items as Array<Record<string, unknown>>;
        }
        return null;
    }, [parsedMetadata]);

    // Check if there is any transaction detail to show
    const hasAnyDetails =
        (structuredFields && structuredFields.length > 0) ||
        (nestedItems && nestedItems.length > 0) ||
        (diffs && diffs.length > 0) ||
        cleanActionDescription;

    // Build raw metadata payload for the optional collapsed view
    const rawPayload = useMemo(() => {
        return (
            parsedMetadata || {
                action: record?.action,
                module: record?.module,
                reference: record?.reference || record?.resource_ref,
                occurred_at: record?.occurred_at,
            }
        );
    }, [parsedMetadata, record]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 1. Main Audit Summary Banner for Issuance (Requirement 5) */}
            {issuanceSummary && (
                <div className="p-3.5 bg-gray-50/90 rounded-md border border-gray-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-950 block">
                            {issuanceSummary.title}
                        </span>
                        {issuanceSummary.risNumber && (
                            <div className="text-xs font-bold font-mono text-gray-900">
                                {issuanceSummary.risNumber}
                            </div>
                        )}
                        {issuanceSummary.recipient && (
                            <div className="text-xs text-gray-700">
                                <span className="font-semibold text-gray-900">{issuanceSummary.recipient}</span>
                                {issuanceSummary.department && (
                                    <span className="text-gray-500"> • {issuanceSummary.department}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {issuanceSummary.stats && (
                        <div className="px-2.5 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-800 self-start sm:self-auto shadow-2xs">
                            {issuanceSummary.stats}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Action Description (Requirement 26) - plain text only, never raw JSON */}
            {cleanActionDescription && (
                <div className="p-3 bg-gray-50/60 rounded-md border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                        Action Description
                    </span>
                    <p className="text-xs text-gray-800 leading-relaxed font-sans">
                        {cleanActionDescription}
                    </p>
                </div>
            )}

            {/* 3. Structured Transaction Details Grid (Requirement 1, 2, 3, 13, 14) */}
            {structuredFields && structuredFields.length > 0 ? (
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                            Transaction Details
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {structuredFields.map((item) => (
                            <div
                                key={item.key}
                                className="bg-gray-50/60 p-2.5 rounded-md border border-gray-200/80 transition-colors hover:bg-gray-50"
                            >
                                <span className="text-gray-500 text-[11px] block font-medium">
                                    {item.label}
                                </span>
                                <span
                                    className={`text-xs font-semibold text-gray-900 mt-1 block break-words ${
                                        item.isMonospace ? 'font-mono' : ''
                                    }`}
                                >
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* 4. Nested Items Section (Requirement 16) */}
            {nestedItems && (
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                        <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                            Affected Items ({nestedItems.length})
                        </span>
                    </div>

                    <div className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-2xs overflow-hidden">
                        {nestedItems.map((item, idx) => {
                            const itemName =
                                (item.item_name as string) ||
                                (item.name as string) ||
                                `Item #${idx + 1}`;
                            const quantity = item.quantity !== undefined ? Number(item.quantity) : null;
                            const unit = (item.unit as string) || (item.unit_of_issue as string) || '';
                            const unitCost = item.unit_cost !== undefined ? Number(item.unit_cost) : null;
                            const itemCode = item.item_code ? String(item.item_code) : null;

                            return (
                                <div
                                    key={idx}
                                    className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-gray-50/60 transition-colors"
                                >
                                    <div>
                                        <span className="font-bold text-gray-900 block">
                                            {itemName}
                                        </span>
                                        {itemCode && (
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                Code: {itemCode}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left sm:text-right">
                                        {quantity !== null && (
                                            <span className="font-semibold text-gray-800 block">
                                                Quantity: {quantity.toLocaleString('en-US')} {unit}
                                            </span>
                                        )}
                                        {unitCost !== null && !isNaN(unitCost) && (
                                            <span className="text-[11px] text-gray-500 font-mono block">
                                                Cost: ₱{unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. Before / After Changes (Requirement 17 & 25) */}
            {diffs && diffs.length > 0 && (
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                        <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px]">
                            Changes & Field Updates
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {diffs.map((diff) => (
                            <div
                                key={diff.key}
                                className="p-2.5 bg-gray-50/70 border border-gray-200 rounded-md space-y-1.5 text-xs"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900">{diff.label}</span>
                                    {diff.changeText && (
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                diff.changeDiff && diff.changeDiff < 0
                                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}
                                        >
                                            Change: {diff.changeText}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
                                    <div>
                                        <span className="text-gray-500 block font-medium">Before</span>
                                        <span className="font-mono text-gray-700 block truncate" title={diff.before}>
                                            {diff.before}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block font-medium">After</span>
                                        <span className="font-mono font-bold text-gray-900 block truncate" title={diff.after}>
                                            {diff.after}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 6. Empty Metadata Fallback (Requirement 18) */}
            {!hasAnyDetails && (
                <div className="p-3 bg-gray-50/60 rounded-md border border-gray-200 text-gray-500 text-xs text-center">
                    No additional transaction details were recorded.
                </div>
            )}

            {/* 7. Collapsible Raw Technical Metadata (Requirement 4 & 15) */}
            <div className="pt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => setShowRaw(!showRaw)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
                >
                    <Code className="w-3.5 h-3.5 text-gray-500" />
                    <span>{showRaw ? 'Hide Raw Metadata' : 'View Raw Metadata'}</span>
                    {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRaw && (
                    <div className="mt-2.5 p-3 bg-slate-900 text-slate-100 rounded-md overflow-x-auto text-[11px] font-mono leading-relaxed space-y-2 shadow-inner">
                        <div className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1 flex justify-between">
                            <span>Raw Technical Metadata (Sanitized)</span>
                            {record?.audit_group_id && (
                                <span className="truncate max-w-xs">Audit Group: {record.audit_group_id}</span>
                            )}
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
                            {JSON.stringify(rawPayload, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
