import { User, PageProps as BasePageProps, FlashMessages as BaseFlashMessages } from '@/types';

export interface Staff {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Disabled' | string;
    email_verified?: boolean;
}

export type AuthUser = User;

export interface AuthProps {
    user: AuthUser;
    permissions?: string[];
    is_system_admin?: boolean;
}

export interface StaffCapabilities {
    canCreate: boolean;
    canUpdate: boolean;
    canToggleStatus: boolean;
    canResendInvitation: boolean;
}

export interface SelectOption {
    value: string;
    label: string;
}

export type FlashMessages = BaseFlashMessages;

export interface NotificationState {
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    title?: string;
}

export type ManageStaffsPageProps = BasePageProps<{
    staffs: Staff[];
    roles: string[];
    capabilities?: StaffCapabilities;
}>;

export interface CreateStaffFormData {
    name: string;
    email: string;
    role: string;
}

export interface EditStaffFormData {
    name: string;
    email: string;
    role: string;
}

export interface StaffStats {
    total: number;
    active: number;
    disabled: number;
    rolesAssigned: number;
}
