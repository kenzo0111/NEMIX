import { ComponentType, ReactNode } from 'react';
import { LucideProps } from 'lucide-react';

export type SidebarCategoryKey = 'overview' | 'logistics' | 'governance';

export interface SidebarCategory {
    key: SidebarCategoryKey;
    title: string;
}

export interface AuthCapabilities {
    dashboard: boolean;
    inventory: {
        view: boolean;
        receiving: boolean;
        issuance: boolean;
    };
    rfid: {
        view: boolean;
    };
    suppliers: {
        view: boolean;
    };
    compliance: {
        reports: boolean;
        analytics: boolean;
    };
    audit: {
        login: boolean;
        transactions: boolean;
    };
    accessControl: {
        roles: boolean;
        staff: boolean;
    };
    systemSettings: boolean;
}

export interface SidebarSubmodule {
    key: string;
    title: string;
    href: string;
    active?: boolean;
    badge?: string;
    requiredCapability?: (caps: AuthCapabilities) => boolean;
    requiredPermission?: string;
}

export interface SidebarModule {
    key: string;
    category: SidebarCategoryKey;
    categoryTitle?: string;
    title: string;
    subtitle?: string;
    icon: ComponentType<LucideProps> | ReactNode;
    href?: string;
    active?: boolean;
    badge?: string;
    requiredCapability?: (caps: AuthCapabilities) => boolean;
    requiredPermission?: string;
    submodules?: SidebarSubmodule[];
}

export interface SidebarUser {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    primary_role?: string;
    roles?: string[];
}

export interface SidebarProps {
    modules?: SidebarModule[];
    user?: SidebarUser;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    className?: string;
    activeModule?: string;
    activeSubmodule?: string;
}
