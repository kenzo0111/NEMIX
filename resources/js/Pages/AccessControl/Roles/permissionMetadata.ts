import { Permission, PermissionAction } from './types';

export interface EnrichedPermissionItem extends Permission {
    key: string;
}

/**
 * Known permission descriptors for NEMIX access control.
 * Used as fallback or client-side enhancer if backend metadata is incomplete.
 */
const KNOWN_PERMISSION_CATALOG: Record<
    string,
    { module: string; action: PermissionAction; displayName: string; description: string }
> = {
    // Inventory
    'inventory.index': {
        module: 'Inventory',
        action: 'view',
        displayName: 'View Inventory',
        description: 'Allows viewing inventory item listings, quantities, and catalog details.',
    },
    'inventory.store': {
        module: 'Inventory',
        action: 'create',
        displayName: 'Create Inventory Item',
        description: 'Allows adding new materials, equipment, and items to the catalog.',
    },
    'inventory.show': {
        module: 'Inventory',
        action: 'view',
        displayName: 'View Item Details',
        description: 'Allows viewing comprehensive specifications and properties of inventory items.',
    },
    'inventory.update': {
        module: 'Inventory',
        action: 'update',
        displayName: 'Update Inventory Item',
        description: 'Allows modifying item descriptions, pricing, and stock metrics.',
    },
    'inventory.destroy': {
        module: 'Inventory',
        action: 'delete',
        displayName: 'Delete Inventory Item',
        description: 'Allows removing or archiving catalog items from inventory.',
    },

    // Issuance
    'inventory.issuance': {
        module: 'Issuance',
        action: 'view',
        displayName: 'View Issuance',
        description: 'Allows viewing item issuance records and requisition issue slips (RIS).',
    },
    'inventory.issuance.store': {
        module: 'Issuance',
        action: 'create',
        displayName: 'Create Issuance Voucher',
        description: 'Allows issuing supplies and generating issuance vouchers for departments.',
    },
    'inventory.issuance.update': {
        module: 'Issuance',
        action: 'update',
        displayName: 'Update Issuance Voucher',
        description: 'Allows modifying issuance slips and recipient records.',
    },
    'inventory.issuance.destroy': {
        module: 'Issuance',
        action: 'delete',
        displayName: 'Delete Issuance Voucher',
        description: 'Allows voiding or deleting item issuance records.',
    },

    // Receiving
    'inventory.receiving': {
        module: 'Receiving',
        action: 'view',
        displayName: 'View Receiving',
        description: 'Allows viewing received deliveries and inspection acceptance reports (IAR).',
    },
    'inventory.receiving.store': {
        module: 'Receiving',
        action: 'create',
        displayName: 'Create Receiving Record',
        description: 'Allows registering incoming supplier deliveries into inventory.',
    },
    'inventory.receiving.update': {
        module: 'Receiving',
        action: 'update',
        displayName: 'Update Receiving Record',
        description: 'Allows modifying delivery quantities and inspection notes.',
    },
    'inventory.receiving.destroy': {
        module: 'Receiving',
        action: 'delete',
        displayName: 'Delete Receiving Record',
        description: 'Allows cancelling or deleting stock delivery records.',
    },

    // RFID Scanner
    'rfid-scanner.index': {
        module: 'RFID Scanner',
        action: 'view',
        displayName: 'View RFID Interface',
        description: 'Allows accessing the RFID hardware scanning console.',
    },
    'rfid-scanner.assign': {
        module: 'RFID Scanner',
        action: 'assign',
        displayName: 'Assign RFID Tag',
        description: 'Allows binding physical RFID tags to inventory assets.',
    },
    'rfid-scanner.unassign': {
        module: 'RFID Scanner',
        action: 'unassign',
        displayName: 'Unassign RFID Tag',
        description: 'Allows releasing RFID tag associations from inventory assets.',
    },
    'rfid-scanner.status': {
        module: 'RFID Scanner',
        action: 'view',
        displayName: 'Check Scanner Status',
        description: 'Allows monitoring reader device connectivity and hardware health.',
    },
    'rfid-scanner.lookup': {
        module: 'RFID Scanner',
        action: 'view',
        displayName: 'Lookup RFID Tag',
        description: 'Allows querying inventory data linked to a scanned RFID tag.',
    },
    'rfid-scanner.live-feed': {
        module: 'RFID Scanner',
        action: 'view',
        displayName: 'Monitor Live Feed',
        description: 'Allows streaming real-time RFID scan detections.',
    },

    // Suppliers
    'suppliers.index': {
        module: 'Suppliers',
        action: 'view',
        displayName: 'View Suppliers',
        description: 'Allows viewing the accredited university vendor directory.',
    },
    'suppliers.store': {
        module: 'Suppliers',
        action: 'create',
        displayName: 'Register Supplier',
        description: 'Allows adding new university vendors and TIN records.',
    },
    'suppliers.show': {
        module: 'Suppliers',
        action: 'view',
        displayName: 'View Supplier Profile',
        description: 'Allows viewing detailed supplier registration and contact credentials.',
    },
    'suppliers.update': {
        module: 'Suppliers',
        action: 'update',
        displayName: 'Update Supplier',
        description: 'Allows modifying vendor profiles and accreditation status.',
    },
    'suppliers.destroy': {
        module: 'Suppliers',
        action: 'delete',
        displayName: 'Delete Supplier',
        description: 'Allows archiving or removing vendors from the registry.',
    },

    // Compliance
    'compliance.reports': {
        module: 'Compliance',
        action: 'view',
        displayName: 'View Compliance Reports',
        description: 'Allows viewing statutory university audit and inventory reports.',
    },
    'compliance.reports.store': {
        module: 'Compliance',
        action: 'generate',
        displayName: 'Generate Compliance Report',
        description: 'Allows compiling official compliance report documents (RPCI, RSMI).',
    },
    'compliance.reports.update': {
        module: 'Compliance',
        action: 'update',
        displayName: 'Update Compliance Report',
        description: 'Allows editing drafted compliance reports and references.',
    },
    'compliance.reports.archive': {
        module: 'Compliance',
        action: 'delete',
        displayName: 'Archive Compliance Report',
        description: 'Allows archiving statutory compliance reports.',
    },
    'compliance.reports.preview_dataset': {
        module: 'Compliance',
        action: 'view',
        displayName: 'Preview Report Dataset',
        description: 'Allows previewing filtered report datasets before compilation.',
    },
    'compliance.analytics': {
        module: 'Compliance',
        action: 'view',
        displayName: 'View Compliance Analytics',
        description: 'Allows reviewing institutional compliance trends and inventory KPIs.',
    },
    'compliance.migrations.store': {
        module: 'Compliance',
        action: 'migrate',
        displayName: 'Execute Data Migration',
        description: 'Allows executing batch migrations for legacy data.',
    },
    'compliance.migrate.stock_card': {
        module: 'Compliance',
        action: 'migrate',
        displayName: 'Migrate Stock Cards',
        description: 'Allows importing historical stock card records into the database.',
    },
    'compliance.migrate.memorandum_receipt': {
        module: 'Compliance',
        action: 'migrate',
        displayName: 'Migrate Memorandum Receipts',
        description: 'Allows importing legacy memorandum receipts.',
    },

    // Audit Logs
    'audit-logs.login-trails': {
        module: 'Audit Logs',
        action: 'view',
        displayName: 'View Login Trails',
        description: 'Allows reviewing staff authentication events, IP addresses, and timestamps.',
    },
    'audit-logs.transaction-trails': {
        module: 'Audit Logs',
        action: 'view',
        displayName: 'View Transaction Trails',
        description: 'Allows reviewing institutional ledger modifications across modules.',
    },

    // Access Control
    'access-control.staffs': {
        module: 'Access Control',
        action: 'view',
        displayName: 'View Staff Accounts',
        description: 'Allows viewing university personnel accounts and role designations.',
    },
    'access-control.staffs.store': {
        module: 'Access Control',
        action: 'create',
        displayName: 'Register Staff Account',
        description: 'Allows inviting new university personnel and granting access.',
    },
    'access-control.staffs.update': {
        module: 'Access Control',
        action: 'update',
        displayName: 'Update Staff Account',
        description: 'Allows modifying staff profile details and role designations.',
    },
    'access-control.staffs.resend-invitation': {
        module: 'Access Control',
        action: 'resend',
        displayName: 'Resend Staff Invitation',
        description: 'Allows resending registration invites to pending staff members.',
    },
    'access-control.staffs.toggle-status': {
        module: 'Access Control',
        action: 'toggle_status',
        displayName: 'Toggle Staff Status',
        description: 'Allows enabling or disabling staff account access.',
    },
    'access-control.role-permission': {
        module: 'Access Control',
        action: 'view',
        displayName: 'View Roles & Permissions',
        description: 'Allows reviewing configured institutional roles and capabilities.',
    },
    'access-control.role-permission.store': {
        module: 'Access Control',
        action: 'create',
        displayName: 'Create Role',
        description: 'Allows registering new administrative role profiles.',
    },
    'access-control.role-permission.update': {
        module: 'Access Control',
        action: 'update',
        displayName: 'Update Role & Permissions',
        description: 'Allows modifying role names and assigned permissions.',
    },
    'access-control.role-permission.destroy': {
        module: 'Access Control',
        action: 'delete',
        displayName: 'Delete Role',
        description: 'Allows deleting custom administrative roles.',
    },

    // System
    'system.mode.show': {
        module: 'System',
        action: 'view',
        displayName: 'View System Mode',
        description: 'Allows viewing current operating mode and environment parameters.',
    },
    'system.mode.update': {
        module: 'System',
        action: 'manage',
        displayName: 'Update System Mode',
        description: 'Allows toggling production, maintenance, or training modes.',
    },
};

function titleCase(text: string): string {
    return text
        .toLowerCase()
        .split(/[\s\-_.]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/**
 * Normalizes a raw permission object or string into a structured Permission.
 */
export function normalizePermission(raw: Partial<Permission> & { name: string; id: number }): Permission {
    const rawName = raw.name || '';
    const cleanRoute = rawName.replace(/^route:/, '');

    if (raw.display_name && raw.module && raw.action) {
        return {
            id: raw.id,
            name: rawName,
            module: raw.module,
            action: raw.action,
            display_name: raw.display_name,
            description: raw.description || `Allows operational access for ${raw.display_name}.`,
        };
    }

    if (KNOWN_PERMISSION_CATALOG[cleanRoute]) {
        const known = KNOWN_PERMISSION_CATALOG[cleanRoute];
        return {
            id: raw.id,
            name: rawName,
            module: known.module,
            action: known.action,
            display_name: known.displayName,
            description: known.description,
        };
    }

    // Dynamic resolution fallback
    const parts = cleanRoute.split('.');
    const moduleKey = parts[0] || 'general';
    const actionKey = parts[parts.length - 1] || 'view';

    let moduleName = titleCase(moduleKey);
    if (moduleKey === 'inventory' && parts[1] && ['issuance', 'receiving'].includes(parts[1])) {
        moduleName = titleCase(parts[1]);
    } else if (moduleKey === 'rfid-scanner') {
        moduleName = 'RFID Scanner';
    } else if (moduleKey === 'audit-logs') {
        moduleName = 'Audit Logs';
    } else if (moduleKey === 'access-control') {
        moduleName = 'Access Control';
    }

    let action: PermissionAction = 'view';
    if (/(store|create)/i.test(actionKey)) action = 'create';
    else if (/(update|edit)/i.test(actionKey)) action = 'update';
    else if (/(destroy|delete|archive)/i.test(actionKey)) action = 'delete';
    else if (/(unassign)/i.test(actionKey)) action = 'unassign';
    else if (/(assign)/i.test(actionKey)) action = 'assign';
    else if (/(migrate)/i.test(actionKey)) action = 'migrate';
    else if (/(resend)/i.test(actionKey)) action = 'resend';
    else if (/(toggle)/i.test(actionKey)) action = 'toggle_status';
    else if (/(generate)/i.test(actionKey)) action = 'generate';
    else if (/(export|download)/i.test(actionKey)) action = 'download';
    else if (/(approve)/i.test(actionKey)) action = 'approve';

    const displayName = titleCase(cleanRoute);

    return {
        id: raw.id,
        name: rawName,
        module: moduleName,
        action,
        display_name: displayName,
        description: `Allows operational access for ${displayName}.`,
    };
}

/**
 * Groups a collection of permissions by their module name.
 * Preserves distinct permission IDs without dropping granular actions.
 */
export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
    const grouped: Record<string, Permission[]> = {};

    for (const perm of permissions) {
        const normalized = normalizePermission(perm);
        const mod = normalized.module || 'General';

        if (!grouped[mod]) {
            grouped[mod] = [];
        }

        // Avoid adding the exact same permission id twice
        if (!grouped[mod].some((item) => item.id === normalized.id)) {
            grouped[mod].push(normalized);
        }
    }

    return grouped;
}

/**
 * Returns a clean, human-readable action label.
 */
export function formatActionLabel(action: PermissionAction): string {
    switch (action) {
        case 'view':
            return 'View';
        case 'create':
            return 'Create';
        case 'update':
            return 'Update';
        case 'delete':
            return 'Delete';
        case 'approve':
            return 'Approve';
        case 'generate':
            return 'Generate';
        case 'download':
            return 'Download';
        case 'export':
            return 'Export';
        case 'assign':
            return 'Assign';
        case 'unassign':
            return 'Unassign';
        case 'manage':
            return 'Manage';
        case 'toggle_status':
            return 'Status';
        case 'resend':
            return 'Resend';
        case 'migrate':
            return 'Migrate';
        default:
            return titleCase(String(action));
    }
}
