export interface LoginTrailItem {
    id: number | string;
    status: string;
    ip_address: string;
    user_agent: string;
    time_ago: string;
    timestamp: string;
}

export interface ActiveSessionItem {
    id: string;
    ip_address: string;
    user_agent: string;
    is_current: boolean;
    last_active: string;
}

export interface LastLoginInfo {
    time_ago: string;
    timestamp: string;
    ip_address: string;
    user_agent: string;
}

export interface UserProfileDetails {
    id: number;
    name: string;
    username?: string;
    email: string;
    email_verified_at?: string | null;
    role: string;
    roles?: string[];
    is_active: boolean;
    account_status: string;
    created_at_formatted?: string;
    created_at_diff?: string | null;
    last_login?: LastLoginInfo | null;
    login_history?: LoginTrailItem[];
    active_sessions?: ActiveSessionItem[];
}

export type ProfileTab = 'profile' | 'security' | 'audit';

export type PasswordStep = 'credentials' | 'otp' | 'success';

export interface FieldErrors {
    current_password?: string;
    password?: string;
    password_confirmation?: string;
    otp?: string;
    general?: string;
}

export type ProfilePageProps = {
    mustVerifyEmail: boolean;
    status?: string;
    profile?: UserProfileDetails;
    [key: string]: unknown;
};
