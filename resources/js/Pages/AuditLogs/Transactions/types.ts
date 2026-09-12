import { User } from '@/types';

export type TransactionAuditStatus =
    | 'logged'
    | 'verified'
    | 'flagged';

export type AuditResult =
    | 'success'
    | 'failed'
    | 'warning'
    | 'recorded';

export type OperationResult =
    | 'success'
    | 'failed'
    | 'warning'
    | 'recorded'
    | null;

export interface AuditUser {
    id: number | null;
    name: string;
    role?: string | null;
    email?: string | null;
}

export type AuditMetadataValue =
    | string
    | number
    | boolean
    | null
    | string[]
    | number[]
    | Record<string, unknown>
    | Record<string, unknown>[];

export interface AuditMetadata {
    [key: string]: AuditMetadataValue | undefined;
}

export interface IssuanceAuditMetadata {
    issuance_id?: number;
    ris_number?: string;
    recipient?: string;
    department?: string;
    total_quantity?: number;
    items_count?: number;
    purpose?: string;
    status?: string;
    items?: Array<{
        item_id?: number;
        item_name?: string;
        quantity?: number;
        unit?: string;
        unit_cost?: number;
    }>;
    [key: string]: AuditMetadataValue | undefined;
}

export interface ReceivingAuditMetadata {
    receiving_id?: number;
    receiving_reference?: string;
    supplier?: string;
    supplier_name?: string;
    supplier_stock_no?: string;
    item?: string;
    item_name?: string;
    quantity_received?: number;
    quantity?: number;
    unit_cost?: number;
    batch_value?: number;
    total_cost?: number;
    batch_number?: string;
    expiry_date?: string;
    [key: string]: AuditMetadataValue | undefined;
}

export interface SupplierAuditMetadata {
    supplier?: string;
    supplier_id?: number;
    name?: string;
    tin?: string;
    registration_number?: string;
    contact_person?: string;
    contact_number?: string;
    status?: string;
    category?: string;
    [key: string]: AuditMetadataValue | undefined;
}

export interface ComplianceReportAuditMetadata {
    report_type?: string;
    report_reference?: string;
    period?: string;
    supplier?: string;
    records_included?: number;
    title?: string;
    [key: string]: AuditMetadataValue | undefined;
}

export interface SystemSettingsAuditMetadata {
    setting?: string;
    updated_keys?: string[];
    diffs?: Record<string, { old: AuditMetadataValue; new: AuditMetadataValue }>;
    previous_value?: AuditMetadataValue;
    new_value?: AuditMetadataValue;
    [key: string]: AuditMetadataValue | undefined;
}

export interface AuditChildEvent {
    id: number;
    event_key: string;
    label: string;
    action: string;
    details?: string | null;
    subject_type?: string | null;
    subject_id?: number | string | null;
    result?: AuditResult;
    metadata?: AuditMetadata | string | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    occurred_at: string;
}

export interface TransactionAuditRecord {
    id: number | string;
    audit_group_id?: string | null;
    is_parent?: boolean;
    event_key?: string | null;
    user_id?: number | null;
    user_name?: string | null;
    user?: string | null;
    role?: string | null;

    action: string;
    secondary_line?: string | null;
    module: string;
    details?: string | null;

    reference?: string | null;
    resource_ref?: string | null;

    audit_status: TransactionAuditStatus;
    status?: string | null;
    result?: AuditResult | OperationResult;

    occurred_at?: string | null;
    time?: string | null;

    children?: AuditChildEvent[];
    metadata?: AuditMetadata | string | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
}

export interface TransactionAuditSummary {
    total: number;
    verified: number;
    flagged: number;
    modules: number;
}

export interface TransactionAuditFilters {
    search?: string | null;
    module?: string | null;
    action?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    view_mode?: 'business' | 'technical';
    page?: number;
}

export interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginatedLink[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface TransactionAuditPageProps {
    auth: {
        user: User;
        permissions?: string[];
        is_system_admin?: boolean;
    };
    logs: PaginatedData<TransactionAuditRecord> | TransactionAuditRecord[];
    summary: TransactionAuditSummary;
    filters: TransactionAuditFilters;
    availableModules?: string[];
    availableActions?: string[];
}
