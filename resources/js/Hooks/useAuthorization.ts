import { useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps, User } from '@/types';

const PERMISSION_ALIASES: Record<string, string[]> = {
    'users.view': [
        'users.view',
        'access-control.staffs',
        'route:access-control.staffs',
    ],
    'users.create': [
        'users.create',
        'access-control.staffs.store',
        'route:access-control.staffs.store',
        'access-control.staffs.resend-invitation',
        'route:access-control.staffs.resend-invitation',
    ],
    'users.update': [
        'users.update',
        'access-control.staffs.update',
        'route:access-control.staffs.update',
    ],
    'users.manage-status': [
        'users.manage-status',
        'access-control.staffs.toggle-status',
        'route:access-control.staffs.toggle-status',
    ],
    'users.assign-role': [
        'users.assign-role',
        'users.update',
        'access-control.staffs.update',
        'route:access-control.staffs.update',
    ],
    'roles.view': [
        'roles.view',
        'access-control.role-permission',
        'route:access-control.role-permission',
    ],
    'roles.create': [
        'roles.create',
        'access-control.role-permission.store',
        'route:access-control.role-permission.store',
    ],
    'roles.update': [
        'roles.update',
        'access-control.role-permission.update',
        'route:access-control.role-permission.update',
    ],
    'roles.delete': [
        'roles.delete',
        'access-control.role-permission.destroy',
        'route:access-control.role-permission.destroy',
    ],
    'permissions.view': [
        'permissions.view',
        'roles.view',
        'access-control.role-permission',
        'route:access-control.role-permission',
    ],
    'permissions.assign': [
        'permissions.assign',
        'roles.update',
        'access-control.role-permission.update',
        'route:access-control.role-permission.update',
    ],
    'permissions.revoke': [
        'permissions.revoke',
        'roles.update',
        'access-control.role-permission.update',
        'route:access-control.role-permission.update',
    ],
    'access-control.view': [
        'access-control.view',
        'users.view',
        'roles.view',
        'access-control.staffs',
        'route:access-control.staffs',
        'access-control.role-permission',
        'route:access-control.role-permission',
    ],

    // Audit Logs
    'audit-logs.view-global': [
        'audit-logs.view-global',
        'audit-logs.login-trails',
        'route:audit-logs.login-trails',
        'audit-logs.transaction-trails',
        'route:audit-logs.transaction-trails',
    ],
    'audit-logs.transaction-trails': [
        'audit-logs.transaction-trails',
        'route:audit-logs.transaction-trails',
        'audit-logs.view-global',
    ],
    'audit-logs.login-trails': [
        'audit-logs.login-trails',
        'route:audit-logs.login-trails',
        'audit-logs.view-global',
    ],

    // RFID Hardware & Scanner
    'rfid.view': [
        'rfid.view',
        'rfid-scanner.index',
        'route:rfid-scanner.index',
        'rfid-scanner.status',
        'route:rfid-scanner.status',
        'rfid-scanner.lookup',
        'route:rfid-scanner.lookup',
        'rfid-scanner.live-feed',
        'route:rfid-scanner.live-feed',
    ],
    'rfid.assign': [
        'rfid.assign',
        'rfid-scanner.assign',
        'route:rfid-scanner.assign',
    ],
    'rfid.unassign': [
        'rfid.unassign',
        'rfid-scanner.unassign',
        'route:rfid-scanner.unassign',
    ],
};

function getPermissionAliases(perm: string): string[] {
    const trimmed = perm.trim();
    const matches: string[] = [trimmed];

    if (PERMISSION_ALIASES[trimmed]) {
        matches.push(...PERMISSION_ALIASES[trimmed]);
    }

    for (const [standard, aliases] of Object.entries(PERMISSION_ALIASES)) {
        if (aliases.includes(trimmed)) {
            matches.push(standard, ...aliases);
        }
    }

    // Bidirectional route prefix resolution
    const expanded: string[] = [];
    for (const match of matches) {
        expanded.push(match);
        if (match.startsWith('route:')) {
            expanded.push(match.substring(6));
        } else {
            expanded.push('route:' + match);
        }
    }

    return Array.from(new Set(expanded));
}

export interface UseAuthorizationReturn {
    can: (permission: string | string[], mode?: 'all' | 'any') => boolean;
    canAny: (permissions: string[]) => boolean;
    canAll: (permissions: string[]) => boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    isSystemAdmin: boolean;
    roles: string[];
    permissions: string[];
    user: User | null;
}

export function useAuthorization(): UseAuthorizationReturn {
    const pageProps = usePage<PageProps>().props;
    const auth = pageProps.auth;
    const user = auth?.user ?? null;

    const roles = useMemo<string[]>(() => {
        const rolesList: string[] = [];
        if (Array.isArray(auth?.roles)) {
            rolesList.push(...auth.roles);
        }
        if (Array.isArray(user?.roles)) {
            rolesList.push(...user.roles);
        }
        if (user?.role && typeof user.role === 'string') {
            rolesList.push(user.role);
        }
        if (user?.primary_role && typeof user.primary_role === 'string') {
            rolesList.push(user.primary_role);
        }
        return Array.from(new Set(rolesList.map((r) => r.trim()).filter(Boolean)));
    }, [auth?.roles, user]);

    const permissions = useMemo<string[]>(() => {
        if (!auth?.permissions || !Array.isArray(auth.permissions)) {
            return [];
        }
        return Array.from(new Set(auth.permissions.map((p) => p.trim()).filter(Boolean)));
    }, [auth?.permissions]);

    const isSystemAdmin = useMemo<boolean>(() => {
        if (auth?.is_system_admin === true) {
            return true;
        }
        return roles.some((role) => {
            const lower = role.toLowerCase();
            return lower === 'system admin' || lower === 'system administrator';
        });
    }, [auth?.is_system_admin, roles]);

    const checkSinglePermission = useCallback(
        (perm: string): boolean => {
            if (isSystemAdmin) {
                return true;
            }
            if (!perm || permissions.length === 0) {
                return false;
            }

            const aliases = getPermissionAliases(perm);
            return aliases.some((alias) => permissions.includes(alias));
        },
        [isSystemAdmin, permissions]
    );

    const can = useCallback(
        (permission: string | string[], mode: 'all' | 'any' = 'all'): boolean => {
            if (isSystemAdmin) {
                return true;
            }

            if (Array.isArray(permission)) {
                if (permission.length === 0) {
                    return false;
                }
                return mode === 'any'
                    ? permission.some((p) => checkSinglePermission(p))
                    : permission.every((p) => checkSinglePermission(p));
            }

            return checkSinglePermission(permission);
        },
        [isSystemAdmin, checkSinglePermission]
    );

    const canAny = useCallback(
        (perms: string[]): boolean => {
            return can(perms, 'any');
        },
        [can]
    );

    const canAll = useCallback(
        (perms: string[]): boolean => {
            return can(perms, 'all');
        },
        [can]
    );

    const hasRole = useCallback(
        (role: string): boolean => {
            const target = role.toLowerCase().trim();
            if (isSystemAdmin && (target === 'system admin' || target === 'system administrator')) {
                return true;
            }
            return roles.some((r) => r.toLowerCase() === target);
        },
        [isSystemAdmin, roles]
    );

    const hasAnyRole = useCallback(
        (rolesToCheck: string[]): boolean => {
            return rolesToCheck.some((r) => hasRole(r));
        },
        [hasRole]
    );

    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasAnyRole,
        isSystemAdmin,
        roles,
        permissions,
        user,
    };
}

export default useAuthorization;
