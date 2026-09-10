import { User } from '@/types';

export type LoginAuditEvent =
    | 'login_success'
    | 'login_failed'
    | 'logout';

export interface LoginAuditRecord {
    id: number | string;
    user_id?: number | null;
    user_name?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    event: LoginAuditEvent;
    status?: string | null;
    ip_address?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    occurred_at?: string | null;
    time?: string | null;
}

export interface LoginAuditSummary {
    total: number;
    successful: number;
    failed: number;
    unique_users: number;
}

export interface LoginAuditFilters {
    search?: string | null;
    role?: string | null;
    status?: string | null;
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

export interface LoginAuditPageProps {
    auth: {
        user: User;
        permissions?: string[];
        is_system_admin?: boolean;
    };
    loginData: PaginatedData<LoginAuditRecord> | LoginAuditRecord[];
    summary: LoginAuditSummary;
    filters: LoginAuditFilters;
    availableRoles?: string[];
    availableStatuses?: { value: string; label: string }[];
}
