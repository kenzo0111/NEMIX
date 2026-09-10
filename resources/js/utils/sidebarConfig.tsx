import {
    LayoutDashboard,
    Package,
    ScanLine,
    Building2,
    FileCheck2,
    History,
    ShieldCheck,
    Settings,
} from 'lucide-react';
import {
    AuthCapabilities,
    SidebarCategory,
    SidebarCategoryKey,
    SidebarModule,
    SidebarSubmodule,
} from '@/types/navigation';

export type { SidebarModule, SidebarSubmodule, AuthCapabilities };
export type Module = SidebarModule;
export type Submodule = SidebarSubmodule;

export const SIDEBAR_CATEGORIES: Record<SidebarCategoryKey, SidebarCategory> = {
    overview: {
        key: 'overview',
        title: 'Overview',
    },
    logistics: {
        key: 'logistics',
        title: 'Logistics & Operations',
    },
    governance: {
        key: 'governance',
        title: 'Administration & Governance',
    },
};

/**
 * Normalizes input keys and names to ensure backwards compatibility
 * between legacy page labels and formal administrative terminology.
 */
function normalizeSubmoduleActive(
    itemKey: string,
    subItemKey: string,
    activeModule?: string,
    activeSubmodule?: string,
    routeCurrentName?: string
): boolean {
    if (activeSubmodule) {
        const normSub = activeSubmodule.toLowerCase().trim();
        if (subItemKey === 'all-items' && normSub === 'all items') return true;
        if (subItemKey === 'receiving' && normSub === 'receiving') return true;
        if (subItemKey === 'issuance' && normSub === 'issuance') return true;
        if (subItemKey === 'supplier-registry' && (normSub === 'supplier registry' || normSub === 'manage supplier')) return true;
        if (subItemKey === 'manage-reports' && (normSub === 'manage reports' || normSub === 'reports')) return true;
        if (subItemKey === 'manage-analytics' && (normSub === 'manage analytics' || normSub === 'analytics')) return true;
        if (subItemKey === 'login-audit' && (normSub === 'login audit' || normSub === 'manage login trails')) return true;
        if (subItemKey === 'transaction-audit' && (normSub === 'transaction audit' || normSub === 'manage transaction')) return true;
        if (subItemKey === 'roles-permissions' && (normSub === 'roles & permissions' || normSub === 'manage role permission' || normSub === 'role permission')) return true;
        if (subItemKey === 'staff-accounts' && (normSub === 'staff accounts' || normSub === 'manage staffs' || normSub === 'staffs')) return true;
    }

    if (routeCurrentName) {
        if (subItemKey === 'all-items' && routeCurrentName === 'inventory.index') return true;
        if (subItemKey === 'receiving' && routeCurrentName.startsWith('inventory.receiving')) return true;
        if (subItemKey === 'issuance' && routeCurrentName.startsWith('inventory.issuance')) return true;
        if (subItemKey === 'supplier-registry' && routeCurrentName.startsWith('suppliers.')) return true;
        if (subItemKey === 'manage-reports' && routeCurrentName.startsWith('compliance.reports')) return true;
        if (subItemKey === 'manage-analytics' && routeCurrentName.startsWith('compliance.analytics')) return true;
        if (subItemKey === 'login-audit' && routeCurrentName.startsWith('audit-logs.login-trails')) return true;
        if (subItemKey === 'transaction-audit' && routeCurrentName.startsWith('audit-logs.transaction-trails')) return true;
        if (subItemKey === 'roles-permissions' && routeCurrentName.startsWith('access-control.role-permission')) return true;
        if (subItemKey === 'staff-accounts' && routeCurrentName.startsWith('access-control.staffs')) return true;
    }

    return false;
}

function normalizeModuleActive(
    itemKey: string,
    activeModule?: string,
    hasActiveSubmodule?: boolean,
    routeCurrentName?: string
): boolean {
    if (hasActiveSubmodule) {
        return true;
    }

    if (activeModule) {
        const normMod = activeModule.toLowerCase().trim();
        if (itemKey === 'dashboard' && normMod === 'dashboard') return true;
        if (itemKey === 'inventory' && normMod === 'inventory') return true;
        if (itemKey === 'rfid-scanner' && (normMod === 'rfid scanner' || normMod === 'rfid')) return true;
        if (itemKey === 'suppliers' && (normMod === 'suppliers' || normMod === 'contract suppliers')) return true;
        if (itemKey === 'compliance' && normMod === 'compliance') return true;
        if (itemKey === 'audit-logs' && normMod === 'audit logs') return true;
        if (itemKey === 'access-control' && (normMod === 'access control' || normMod === 'access')) return true;
        if (itemKey === 'system-settings' && (normMod === 'system settings' || normMod === 'settings')) return true;
    }

    if (routeCurrentName) {
        if (itemKey === 'dashboard' && routeCurrentName === 'dashboard') return true;
        if (itemKey === 'rfid-scanner' && routeCurrentName.startsWith('rfid-scanner.')) return true;
        if (itemKey === 'system-settings' && routeCurrentName.startsWith('system.settings.')) return true;
    }

    // Default dashboard active when nothing specified
    if (!activeModule && !routeCurrentName && itemKey === 'dashboard') {
        return true;
    }

    return false;
}

export function getSidebarModules(activeModule?: string, activeSubmodule?: string): SidebarModule[] {
    const routeCurrentName = typeof route === 'function' ? route().current() : undefined;

    // Define RAW modules configuration
    const rawModules: SidebarModule[] = [
        // OVERVIEW
        {
            key: 'dashboard',
            category: 'overview',
            categoryTitle: SIDEBAR_CATEGORIES.overview.title,
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: route('dashboard'),
            requiredCapability: (caps) => caps.dashboard,
            requiredPermission: 'route:dashboard',
        },

        // LOGISTICS & OPERATIONS
        {
            key: 'inventory',
            category: 'logistics',
            categoryTitle: SIDEBAR_CATEGORIES.logistics.title,
            title: 'Inventory',
            icon: Package,
            href: '#',
            requiredCapability: (caps) =>
                caps.inventory.view || caps.inventory.receiving || caps.inventory.issuance,
            requiredPermission: 'route:inventory.index',
            submodules: [
                {
                    key: 'all-items',
                    title: 'All Items',
                    href: route('inventory.index'),
                    requiredCapability: (caps) => caps.inventory.view,
                    requiredPermission: 'route:inventory.index',
                },
                {
                    key: 'receiving',
                    title: 'Receiving',
                    href: route('inventory.receiving'),
                    requiredCapability: (caps) => caps.inventory.receiving,
                    requiredPermission: 'route:inventory.receiving',
                },
                {
                    key: 'issuance',
                    title: 'Issuance',
                    href: route('inventory.issuance'),
                    requiredCapability: (caps) => caps.inventory.issuance,
                    requiredPermission: 'route:inventory.issuance',
                },
            ],
        },
        {
            key: 'rfid-scanner',
            category: 'logistics',
            categoryTitle: SIDEBAR_CATEGORIES.logistics.title,
            title: 'RFID Scanner',
            icon: ScanLine,
            href: route('rfid-scanner.index'),
            requiredCapability: (caps) => caps.rfid.view,
            requiredPermission: 'route:rfid-scanner.index',
        },

        // ADMINISTRATION & GOVERNANCE
        {
            key: 'suppliers',
            category: 'governance',
            categoryTitle: SIDEBAR_CATEGORIES.governance.title,
            title: 'Suppliers',
            icon: Building2,
            href: '#',
            requiredCapability: (caps) => caps.suppliers.view,
            requiredPermission: 'route:suppliers.index',
            submodules: [
                {
                    key: 'supplier-registry',
                    title: 'Supplier Registry',
                    href: route('suppliers.index'),
                    requiredCapability: (caps) => caps.suppliers.view,
                    requiredPermission: 'route:suppliers.index',
                },
            ],
        },
        {
            key: 'compliance',
            category: 'governance',
            categoryTitle: SIDEBAR_CATEGORIES.governance.title,
            title: 'Compliance',
            icon: FileCheck2,
            href: '#',
            requiredCapability: (caps) => caps.compliance.reports || caps.compliance.analytics,
            requiredPermission: 'route:compliance.reports',
            submodules: [
                {
                    key: 'manage-reports',
                    title: 'Manage Reports',
                    href: route('compliance.reports'),
                    requiredCapability: (caps) => caps.compliance.reports,
                    requiredPermission: 'route:compliance.reports',
                },
                {
                    key: 'manage-analytics',
                    title: 'Manage Analytics',
                    href: route('compliance.analytics'),
                    requiredCapability: (caps) => caps.compliance.analytics,
                    requiredPermission: 'route:compliance.analytics',
                },
            ],
        },
        {
            key: 'audit-logs',
            category: 'governance',
            categoryTitle: SIDEBAR_CATEGORIES.governance.title,
            title: 'Audit Logs',
            icon: History,
            href: '#',
            requiredCapability: (caps) => caps.audit.login || caps.audit.transactions,
            requiredPermission: 'route:audit-logs.login-trails',
            submodules: [
                {
                    key: 'login-audit',
                    title: 'Login Audit',
                    href: route('audit-logs.login-trails'),
                    requiredCapability: (caps) => caps.audit.login,
                    requiredPermission: 'route:audit-logs.login-trails',
                },
                {
                    key: 'transaction-audit',
                    title: 'Transaction Audit',
                    href: route('audit-logs.transaction-trails'),
                    requiredCapability: (caps) => caps.audit.transactions,
                    requiredPermission: 'route:audit-logs.transaction-trails',
                },
            ],
        },
        {
            key: 'access-control',
            category: 'governance',
            categoryTitle: SIDEBAR_CATEGORIES.governance.title,
            title: 'Access Control',
            icon: ShieldCheck,
            href: '#',
            requiredCapability: (caps) => caps.accessControl.roles || caps.accessControl.staff,
            requiredPermission: 'route:access-control.role-permission',
            submodules: [
                {
                    key: 'roles-permissions',
                    title: 'Roles & Permissions',
                    href: route('access-control.role-permission'),
                    requiredCapability: (caps) => caps.accessControl.roles,
                    requiredPermission: 'route:access-control.role-permission',
                },
                {
                    key: 'staff-accounts',
                    title: 'Staff Accounts',
                    href: route('access-control.staffs'),
                    requiredCapability: (caps) => caps.accessControl.staff,
                    requiredPermission: 'route:access-control.staffs',
                },
            ],
        },
        {
            key: 'system-settings',
            category: 'governance',
            categoryTitle: SIDEBAR_CATEGORIES.governance.title,
            title: 'System Settings',
            icon: Settings,
            href: route('system.settings.index'),
            requiredCapability: (caps) => caps.systemSettings,
            requiredPermission: 'route:system.settings.index',
        },
    ];

    // Compute active states
    return rawModules.map((module) => {
        let hasActiveSubmodule = false;
        const submodules = module.submodules?.map((sub) => {
            const isSubActive = normalizeSubmoduleActive(
                module.key,
                sub.key,
                activeModule,
                activeSubmodule,
                routeCurrentName
            );
            if (isSubActive) {
                hasActiveSubmodule = true;
            }
            return {
                ...sub,
                active: isSubActive,
            };
        });

        const isModuleActive = normalizeModuleActive(
            module.key,
            activeModule,
            hasActiveSubmodule,
            routeCurrentName
        );

        return {
            ...module,
            active: isModuleActive,
            submodules,
        };
    });
}