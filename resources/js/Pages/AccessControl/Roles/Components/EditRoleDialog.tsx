import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import Field from '@/Components/ui/field';
import { Button } from '@/Components/ui/button';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { X, Lock, Sliders, Loader2 } from 'lucide-react';
import { useValidationFocus } from '@/Hooks/useValidationFocus';
import { Role, Permission, EditRoleFormData, ModuleStats } from '../types';
import PermissionModuleList from './PermissionModuleList';
import PermissionList from './PermissionList';

interface EditRoleDialogProps {
    isOpen: boolean;
    role: Role | null;
    totalSystemPermissionsCount: number;
    permissionsByModule: Record<string, Permission[]>;
    assignablePermissionIds?: number[];
    onClose: () => void;
}

export default function EditRoleDialog({
    isOpen,
    role,
    totalSystemPermissionsCount,
    permissionsByModule,
    assignablePermissionIds,
    onClose,
}: EditRoleDialogProps) {
    const { data, setData, put, processing, errors, clearErrors } = useForm<EditRoleFormData>({
        name: '',
        permissions: [],
    });
    useValidationFocus(errors);

    const visiblePermissionsByModule = useMemo(() => {
        const allowed = new Set(assignablePermissionIds ?? Object.values(permissionsByModule).flat().map((permission) => permission.id));
        return Object.fromEntries(Object.entries(permissionsByModule)
            .map(([name, permissions]) => [name, permissions.filter((permission) => allowed.has(permission.id))] as const)
            .filter(([, permissions]) => permissions.length > 0));
    }, [permissionsByModule, assignablePermissionIds]);
    const moduleNames = useMemo(() => Object.keys(visiblePermissionsByModule), [visiblePermissionsByModule]);
    const [activeModuleTab, setActiveModuleTab] = useState<string>('');
    const [permSearchQuery, setPermSearchQuery] = useState<string>('');

    // Sync form state when role changes or dialog opens
    useEffect(() => {
        if (role && isOpen) {
            setData({
                name: role.name,
                permissions: [...role.permissions],
            });
            clearErrors();
            setPermSearchQuery('');

            if (moduleNames.length > 0) {
                setActiveModuleTab((prev) =>
                    prev && visiblePermissionsByModule[prev] ? prev : moduleNames[0]
                );
            }
        }
    }, [role, isOpen, moduleNames, visiblePermissionsByModule, setData, clearErrors]);

    // Clear search query when switching modules
    const handleSelectModule = (mod: string) => {
        setActiveModuleTab(mod);
        setPermSearchQuery('');
    };

    // Module stats
    const getModuleStats = useCallback(
        (moduleName: string): ModuleStats => {
            const perms = visiblePermissionsByModule[moduleName] || [];
            const total = perms.length;
            const assigned = perms.filter((p) => data.permissions.includes(p.id)).length;
            return { assigned, total };
        },
        [visiblePermissionsByModule, data.permissions]
    );

    // Toggle single permission
    const handleTogglePermission = (permissionId: number) => {
        const isAssigned = data.permissions.includes(permissionId);
        const updated = isAssigned
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId];

        setData('permissions', updated);
    };

    // Select all in current module
    const handleSelectAllModule = (selectAll: boolean) => {
        if (!activeModuleTab || !visiblePermissionsByModule[activeModuleTab]) return;

        const currentModulePermIds = visiblePermissionsByModule[activeModuleTab].map((p) => p.id);
        let updated = [...data.permissions];

        if (selectAll) {
            for (const id of currentModulePermIds) {
                if (!updated.includes(id)) {
                    updated.push(id);
                }
            }
        } else {
            updated = updated.filter((id) => !currentModulePermIds.includes(id));
        }

        setData('permissions', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!role || !data.name.trim()) return;

        put(route('access-control.role-permission.update', role.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    if (!role) return null;

    const currentModulePermissions = visiblePermissionsByModule[activeModuleTab] || [];
    const isSystemRole = role.is_system;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl" closeable={!processing} ariaLabel="Edit Role and Permissions">
            {/* Institutional Maroon Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            {/* Header */}
                <DialogHeader className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isSystemRole
    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" : "bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-300"}`}
                        >
                            {isSystemRole ? (
                                <Lock className="w-5 h-5" />
                            ) : (
                                <Sliders className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Edit Role & Permissions
                                </h3>
                                {isSystemRole ? (
                                    <span className="inline-flex items-center gap-1 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        System Role
                                    </span>
                                ) : (
                                    <span className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        Custom Role
                                    </span>
                                )}
                            </div>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                                Configure title and granular capabilities for{' '}
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{role.name}</strong>.
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"
                        type="button"
                        onClick={onClose}
                        className="shrink-0 ml-2"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Form Body */}
                <form
                    id="edit-role-form"
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className="p-4 sm:p-6 space-y-5">
                    {/* Role Name Field */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700 rounded-lg p-4">
                        <Field id="edit-role-name" label="Role Name" required error={errors.name}>
                            <div className="relative max-w-md">
                                <input aria-invalid={Boolean(errors.name)}
                                    type="text"
                                    id="edit-role-name"
                                    value={data.name}
                                    disabled={isSystemRole}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={"ui-field " + (`bg-white dark:bg-slate-800 border text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 block w-full py-2.5 px-3 transition-all ${isSystemRole
        ? "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700 pl-9" : errors.name
        ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                                    required
                                />
                                {isSystemRole && (
                                    <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                                )}
                            </div>
                        </Field>
                        {isSystemRole && (
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                                System role names are protected and cannot be changed.
                            </p>
                        )}
                    </div>

                    {/* Permission Section Header */}
                    <div>
                        <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 normal-case tracking-normal">
                            Permission Assignments
                        </h4>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Select the operational actions permitted for this role across system modules.
                        </p>
                    </div>

                    {/* Two-Column Permission Layout (Tablet & Desktop: md:flex) */}
                    <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[400px] shadow-sm">
                        <PermissionModuleList
                            modules={moduleNames}
                            activeModule={activeModuleTab}
                            onSelectModule={handleSelectModule}
                            getModuleStats={getModuleStats}
                        />

                        <PermissionList
                            moduleName={activeModuleTab}
                            permissions={currentModulePermissions}
                            assignedPermissionIds={data.permissions}
                            searchQuery={permSearchQuery}
                            onSearchChange={setPermSearchQuery}
                            onTogglePermission={handleTogglePermission}
                            onSelectAllModule={handleSelectAllModule}
                        />
                    </div>
                    </DialogBody>
                </form>

                {/* Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 shrink-0 gap-3 bg-slate-50/80 dark:bg-slate-950 sticky bottom-0">
                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {data.permissions.length} of {totalSystemPermissionsCount}
                        </span>{' '}
                        permissions assigned
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto text-center"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary"
                            type="submit"
                            form="edit-role-form"
                            disabled={processing || !data.name.trim()}
                            className="w-full sm:w-auto text-center flex items-center justify-center gap-1.5 tabular-nums"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
        </Modal>
    );
}
