import { PageProps as BasePageProps, FlashMessages as BaseFlashMessages } from '@/types';

export type PermissionAction =
    | 'view'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'generate'
    | 'download'
    | 'export'
    | 'assign'
    | 'unassign'
    | 'manage'
    | 'toggle_status'
    | 'resend'
    | 'migrate'
    | string;

export interface Permission {
    id: number;
    name: string;
    module: string;
    action: PermissionAction;
    display_name: string;
    description?: string | null;
}

export interface Role {
    id: number;
    name: string;
    permissions: number[];
    permissions_count: number;
    is_system: boolean;
    is_deletable: boolean;
    is_editable?: boolean;
    users_count?: number;
}

export interface RoleCapabilities {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export interface NotificationState {
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    title?: string;
}

export type FlashMessages = BaseFlashMessages;

export type ManageRolePermissionPageProps = BasePageProps<{
    roles: Role[];
    permissions: Permission[];
    capabilities?: RoleCapabilities;
}>;

export interface CreateRoleFormData {
    name: string;
}

export interface EditRoleFormData {
    name: string;
    permissions: number[];
}

export interface ModuleStats {
    assigned: number;
    total: number;
}
