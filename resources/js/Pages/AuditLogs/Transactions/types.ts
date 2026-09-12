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

export interface AuditChildEvent {
    id: number;
    event_key: string;
    label: string;
    action: string;
    details?: string | null;
    subject_type?: string | null;
    subject_id?: number | string | null;
    result?: AuditResult;
    metadata?: Record<string, unknown> | null;
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
    metadata?: Record<string, unknown> | null;
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
