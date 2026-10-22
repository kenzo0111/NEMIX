import type { PageProps } from '@/types';
export const SYSTEM_TITLE = 'Consumable Supply Management';
// Presentation only. Permissions and capabilities remain server controlled.
export function roleDesignation(auth: PageProps['auth']): string {
    const role = auth.user?.primary_role || auth.user?.role || auth.roles?.[0] || auth.user?.roles?.[0];
    const aliases: Record<string, string> = {
        'system admin': 'Administrator', 'system administrator': 'Administrator', 'admin': 'Administrator',
        'property custodian': 'Inventory Custodian', 'inventory custodian': 'Inventory Custodian',
        'spmo personnel': 'SPMO Personnel', 'inventory staff': 'SPMO Personnel',
        'supply coordinator': 'Supply Coordinator', 'authorized personnel': 'Authorized Personnel',
    };
    return auth.is_system_admin ? 'Administrator' : aliases[role?.trim().toLowerCase() || ''] || role?.trim() || 'Staff';
}
