import { User } from '@/types';

export type TransactionAuditStatus =
    | 'logged'
    | 'verified'
    | 'flagged';

export type OperationResult =
    | 'success'
    | 'failed'
    | null;

export interface TransactionAuditRecord {
    id: number | string;
    user_id?: number | null;
    user_name?: string | null;
    user?: string | null;
    role?: string | null;

    action: string;
    module: string;
    details?: string | null;

    reference?: string | null;
    resource_ref?: string | null;

    audit_status: TransactionAuditStatus;
    status?: string | null;
    result?: OperationResult;

    occurred_at?: string | null;
    time?: string | null;
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
