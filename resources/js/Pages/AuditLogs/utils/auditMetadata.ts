import { AuditMetadata, AuditMetadataValue, TransactionAuditRecord } from '../Transactions/types';

const SENSITIVE_PATTERNS = [
    'password',
    'password_confirmation',
    'remember_token',
    'token',
    'otp',
    'secret',
    'api_key',
    'auth',
    'authorization',
    'session',
    'session_id',
    'credential',
    'smtp_password',
    'smtp_pass',
    'reset_token',
    'private_key',
];

const KNOWN_LABELS: Record<string, string> = {
    issuance_id: 'Issuance ID',
    ris_number: 'RIS Number',
    ris_no: 'RIS No.',
    recipient: 'Recipient',
    department: 'Department',
    total_quantity: 'Total Quantity',
    items_count: 'Items',
    items: 'Items',
    supplier_stock_no: 'Supplier Stock No.',
    unit_cost: 'Unit Cost',
    quantity_remaining: 'Quantity Remaining',
    quantity_received: 'Quantity Received',
    quantity: 'Quantity',
    batch_value: 'Batch Value',
    total_cost: 'Total Cost',
    batch_number: 'Batch Number',
    expiry_date: 'Expiry Date',
    report_reference: 'Report Reference',
    report_type: 'Report Type',
    records_included: 'Records Included',
    period: 'Period',
    supplier: 'Supplier',
    supplier_name: 'Supplier',
    tin: 'TIN',
    registration_number: 'Registration Number',
    contact_person: 'Contact Person',
    contact_number: 'Contact Number',
    operating_mode: 'Operating Mode',
    previous_mode: 'Previous Mode',
    active_mode: 'Active Mode',
    change_reason: 'Reason for Change',
    stock_card_reference: 'Stock Card Reference',
    iar_number: 'IAR Number',
    par_number: 'PAR Number',
    ics_number: 'ICS Number',
    pr_number: 'PR Number',
    item_name: 'Item Name',
    item: 'Item',
    sku: 'SKU',
    status: 'Status',
    unit_of_issue: 'Unit of Issue',
    unit: 'Unit',
    receiving_reference: 'Receiving Reference',
    receiving_id: 'Receiving ID',
    low_stock_threshold: 'Low Stock Threshold',
    critical_stock_threshold: 'Critical Stock Threshold',
    purpose: 'Purpose',
    remarks: 'Remarks',
    user_id: 'User ID',
    created_at: 'Created At',
    updated_at: 'Updated At',
    occurred_at: 'Occurred At',
};

const ACRONYMS = new Set([
    'ID',
    'RIS',
    'TIN',
    'SKU',
    'PAR',
    'ICS',
    'IAR',
    'PR',
    'RSMI',
    'RPCI',
    'OTP',
    'IP',
    'URL',
    'GSM',
    'CCMS',
    'RSD',
]);

/**
 * Check if a string is a valid JSON string (object or array).
 */
export function isJsonString(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (
        (!trimmed.startsWith('{') || !trimmed.endsWith('}')) &&
        (!trimmed.startsWith('[') || !trimmed.endsWith(']'))
    ) {
        return false;
    }

    try {
        const parsed = JSON.parse(trimmed);
        return parsed !== null && typeof parsed === 'object';
    } catch {
        return false;
    }
}

/**
 * Safely parse an audit metadata value.
 * Supports: objects, JSON strings, arrays, or falls back to null on failure.
 */
export function parseAuditMetadata(value: unknown): AuditMetadata | null {
    if (!value) return null;

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as AuditMetadata;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed as AuditMetadata;
                }
            } catch {
                return null;
            }
        }
    }

    return null;
}

/**
 * Recursively sanitize sensitive keys from an audit metadata payload.
 */
export function sanitizeAuditMetadata<T = AuditMetadata | Record<string, unknown>>(
    metadata: unknown
): T | null {
    if (!metadata) return null;

    if (Array.isArray(metadata)) {
        return metadata.map((item) => sanitizeAuditMetadata(item)) as unknown as T;
    }

    if (typeof metadata === 'object') {
        const result: Record<string, unknown> = {};

        for (const [key, val] of Object.entries(metadata as Record<string, unknown>)) {
            const keyLower = key.toLowerCase();
            const isSensitive = SENSITIVE_PATTERNS.some((pattern) => keyLower.includes(pattern));

            if (isSensitive) {
                result[key] = '[REDACTED]';
            } else if (typeof val === 'object' && val !== null) {
                result[key] = sanitizeAuditMetadata(val);
            } else {
                result[key] = val;
            }
        }

        return result as T;
    }

    return metadata as T;
}

/**
 * Convert technical keys into human-readable user-facing labels.
 * E.g., `total_quantity` -> `Total Quantity`, `ris_number` -> `RIS Number`
 */
export function formatAuditFieldLabel(key: string): string {
    const cleanKey = key.trim();
    if (KNOWN_LABELS[cleanKey]) {
        return KNOWN_LABELS[cleanKey];
    }

    // Convert camelCase or snake_case to words
    const words = cleanKey
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/);

    return words
        .map((word) => {
            const upper = word.toUpperCase();
            if (ACRONYMS.has(upper)) {
                return upper;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

export interface FormattedAuditValue {
    text: string;
    isMonospace?: boolean;
    isCurrency?: boolean;
}

/**
 * Format audit value according to its type and field context.
 */
export function formatAuditValue(key: string, value: unknown): FormattedAuditValue {
    if (value === null || value === undefined || value === '') {
        return { text: 'Not recorded' };
    }

    if (typeof value === 'boolean') {
        return { text: value ? 'Yes' : 'No' };
    }

    const keyLower = key.toLowerCase();

    // Check for ID fields - keep as clean integer/string, monospace, NEVER format as money/date
    const isIdField =
        keyLower === 'id' ||
        keyLower.endsWith('_id') ||
        keyLower === 'user_id' ||
        keyLower === 'subject_id';

    if (isIdField) {
        return {
            text: String(value),
            isMonospace: true,
        };
    }

    // Check for reference codes and numbers - keep as monospace string
    const isCodeOrRef =
        keyLower.includes('ris') ||
        keyLower.includes('reference') ||
        keyLower.includes('stock_no') ||
        keyLower === 'tin' ||
        keyLower.includes('registration') ||
        keyLower === 'sku' ||
        keyLower.includes('batch_no') ||
        keyLower.includes('batch_number');

    if (isCodeOrRef) {
        return {
            text: String(value),
            isMonospace: true,
        };
    }

    // Check for monetary values
    const isMoneyField =
        (keyLower.includes('cost') ||
            keyLower.includes('price') ||
            keyLower.includes('value') ||
            keyLower.includes('amount') ||
            keyLower.includes('subtotal') ||
            keyLower.includes('grand_total')) &&
        !keyLower.includes('id') &&
        !keyLower.includes('count') &&
        !keyLower.includes('quantity');

    if (isMoneyField) {
        const num = Number(value);
        if (!isNaN(num)) {
            return {
                text: `₱${num.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
                isCurrency: true,
            };
        }
    }

    // Check for quantities and counts
    const isCountField =
        keyLower.includes('quantity') ||
        keyLower.includes('count') ||
        keyLower.includes('items') ||
        keyLower.includes('records_included') ||
        keyLower.includes('stock') ||
        keyLower.includes('threshold');

    if (isCountField) {
        const num = Number(value);
        if (!isNaN(num)) {
            return {
                text: num.toLocaleString('en-US'),
            };
        }
    }

    // Numbers without specific context
    if (typeof value === 'number') {
        return {
            text: value.toLocaleString('en-US'),
        };
    }

    // Dates
    if (typeof value === 'string') {
        const isDateString = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(
            value.trim()
        );

        if (isDateString && (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('at'))) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    const hasTime = value.includes('T') || value.includes(':');
                    if (hasTime) {
                        return {
                            text: date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            }),
                        };
                    }
                    return {
                        text: date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                    };
                }
            } catch {
                // Fall through to plain string
            }
        }

        return { text: value };
    }

    // Arrays of primitives
    if (Array.isArray(value)) {
        if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
            return { text: value.join(', ') };
        }
        return { text: `${value.length} items recorded` };
    }

    if (typeof value === 'object') {
        return { text: JSON.stringify(value) };
    }

    return { text: String(value) };
}

export type EventCategory =
    | 'issuance'
    | 'receiving'
    | 'supplier'
    | 'compliance_report'
    | 'system_settings'
    | 'general';

/**
 * Detect event category based on event_key, metadata shape, module, or action.
 */
export function detectEventType(
    eventKey?: string | null,
    metadata?: AuditMetadata | null,
    module?: string | null,
    action?: string | null
): EventCategory {
    const key = (eventKey || '').toLowerCase();
    const mod = (module || '').toLowerCase();
    const act = (action || '').toLowerCase();

    if (
        key.includes('issuance') ||
        mod.includes('issuance') ||
        act.includes('issuance') ||
        act.includes('issue') ||
        (metadata && ('ris_number' in metadata || 'issuance_id' in metadata))
    ) {
        return 'issuance';
    }

    if (
        key.includes('receiving') ||
        mod.includes('receiving') ||
        act.includes('receiving') ||
        act.includes('stock in') ||
        (metadata && ('receiving_reference' in metadata || 'supplier_stock_no' in metadata))
    ) {
        return 'receiving';
    }

    if (
        key.includes('supplier') ||
        mod.includes('supplier') ||
        act.includes('supplier') ||
        (metadata && ('tin' in metadata || 'registration_number' in metadata))
    ) {
        return 'supplier';
    }

    if (
        key.includes('compliance') ||
        key.includes('report') ||
        key.includes('rsmi') ||
        key.includes('rpci') ||
        mod.includes('compliance') ||
        (metadata && ('report_type' in metadata || 'report_reference' in metadata))
    ) {
        return 'compliance_report';
    }

    if (
        key.includes('settings') ||
        key.includes('mode') ||
        mod.includes('configuration') ||
        mod.includes('administration') ||
        (metadata && ('updated_keys' in metadata || 'diffs' in metadata))
    ) {
        return 'system_settings';
    }

    return 'general';
}

export interface IssuanceSummaryInfo {
    title: string;
    risNumber?: string;
    recipient?: string;
    department?: string;
    stats?: string;
}

/**
 * Extract concise summary info for stock issuance events (Requirement 5).
 */
export function getIssuanceSummary(
    metadata?: AuditMetadata | null,
    record?: TransactionAuditRecord
): IssuanceSummaryInfo | null {
    if (!metadata && !record) return null;

    const risNumber =
        (metadata?.ris_number as string) ||
        (record?.reference as string) ||
        (record?.resource_ref as string) ||
        undefined;

    const recipient = (metadata?.recipient as string) || undefined;
    const department = (metadata?.department as string) || undefined;

    const totalQty = metadata?.total_quantity;
    const itemsCount = metadata?.items_count ?? (Array.isArray(metadata?.items) ? metadata?.items.length : undefined);

    let stats: string | undefined;
    if (itemsCount !== undefined || totalQty !== undefined) {
        const parts: string[] = [];
        if (itemsCount !== undefined) {
            const countNum = Number(itemsCount);
            parts.push(`${countNum.toLocaleString('en-US')} ${countNum === 1 ? 'item' : 'items'}`);
        }
        if (totalQty !== undefined) {
            const qtyNum = Number(totalQty);
            parts.push(`${qtyNum.toLocaleString('en-US')} total quantity`);
        }
        stats = parts.join(' • ');
    }

    return {
        title: record?.action || 'Created Stock Issuance',
        risNumber,
        recipient,
        department,
        stats,
    };
}

export interface BeforeAfterDiff {
    key: string;
    label: string;
    before: string;
    after: string;
    changeText?: string;
    changeDiff?: number | null;
}

/**
 * Format before and after audit changes into structured diff records (Requirement 17).
 */
export function getBeforeAfterDiffs(
    oldValues?: Record<string, unknown> | null,
    newValues?: Record<string, unknown> | null,
    metadataDiffs?: unknown
): BeforeAfterDiff[] {
    const diffs: BeforeAfterDiff[] = [];

    // Handle metadata.diffs structure (e.g. from SystemSettings batch updates)
    if (metadataDiffs && typeof metadataDiffs === 'object' && !Array.isArray(metadataDiffs)) {
        for (const [key, val] of Object.entries(metadataDiffs as Record<string, unknown>)) {
            if (val && typeof val === 'object' && 'old' in val && 'new' in val) {
                const oldVal = (val as { old: unknown; new: unknown }).old;
                const newVal = (val as { old: unknown; new: unknown }).new;

                const beforeFmt = formatAuditValue(key, oldVal).text;
                const afterFmt = formatAuditValue(key, newVal).text;

                let changeDiff: number | null = null;
                let changeText: string | undefined;

                if (typeof oldVal === 'number' && typeof newVal === 'number') {
                    changeDiff = newVal - oldVal;
                    changeText = changeDiff > 0 ? `+${changeDiff}` : `${changeDiff}`;
                }

                diffs.push({
                    key,
                    label: formatAuditFieldLabel(key),
                    before: beforeFmt,
                    after: afterFmt,
                    changeText,
                    changeDiff,
                });
            }
        }
        if (diffs.length > 0) {
            return diffs;
        }
    }

    // Handle standard old_values vs new_values
    if (newValues && typeof newValues === 'object') {
        for (const [key, newVal] of Object.entries(newValues)) {
            const oldVal = oldValues?.[key];

            const beforeFmt = formatAuditValue(key, oldVal).text;
            const afterFmt = formatAuditValue(key, newVal).text;

            if (beforeFmt === afterFmt) continue;

            let changeDiff: number | null = null;
            let changeText: string | undefined;

            if (typeof oldVal === 'number' && typeof newVal === 'number') {
                changeDiff = newVal - oldVal;
                changeText = changeDiff > 0 ? `+${changeDiff}` : `${changeDiff}`;
            }

            diffs.push({
                key,
                label: formatAuditFieldLabel(key),
                before: beforeFmt,
                after: afterFmt,
                changeText,
                changeDiff,
            });
        }
    }

    return diffs;
}

/**
 * Get clean human-readable secondary text for the main table row.
 * Guarantees that raw JSON strings are never rendered in table rows.
 */
export function getAuditSecondaryText(record: TransactionAuditRecord): string | null {
    // If secondary_line is provided and NOT a raw JSON string, use it
    if (record.secondary_line && !isJsonString(record.secondary_line)) {
        return record.secondary_line;
    }

    // If details is provided and NOT a raw JSON string, use it
    if (record.details && !isJsonString(record.details)) {
        return record.details;
    }

    // If secondary_line or details was a JSON string, extract readable info
    const parsed =
        parseAuditMetadata(record.metadata) ||
        parseAuditMetadata(record.secondary_line) ||
        parseAuditMetadata(record.details);

    if (parsed) {
        if (parsed.ris_number) {
            const count = parsed.items_count ?? (Array.isArray(parsed.items) ? parsed.items.length : 1);
            return `${parsed.ris_number} • ${count} ${count === 1 ? 'item' : 'items'} issued`;
        }
        if (parsed.receiving_reference) {
            return `Receiving reference: ${parsed.receiving_reference}`;
        }
        if (parsed.report_reference) {
            return `Compliance report: ${parsed.report_reference}`;
        }
    }

    return null;
}
