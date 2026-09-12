import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { X, Lock, Sliders } from 'lucide-react';
import { Role, Permission, EditRoleFormData, ModuleStats } from '../types';
import PermissionModuleList from './PermissionModuleList';
import PermissionList from './PermissionList';

interface EditRoleDialogProps {
    isOpen: boolean;
    role: Role | null;
    totalSystemPermissionsCount: number;
    permissionsByModule: Record<string, Permission[]>;
    onClose: () => void;
}

export default function EditRoleDialog({
    isOpen,
    role,
    totalSystemPermissionsCount,
    permissionsByModule,
    onClose,
}: EditRoleDialogProps) {
    const { data, setData, put, processing, errors, clearErrors } = useForm<EditRoleFormData>({
        name: '',
        permissions: [],
    });

    const moduleNames = useMemo(() => Object.keys(permissionsByModule), [permissionsByModule]);
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
                    prev && permissionsByModule[prev] ? prev : moduleNames[0]
                );
            }
        }
    }, [role, isOpen, moduleNames, permissionsByModule, setData, clearErrors]);

    // Clear search query when switching modules
    const handleSelectModule = (mod: string) => {
        setActiveModuleTab(mod);
        setPermSearchQuery('');
    };

    // Module stats
    const getModuleStats = useCallback(
        (moduleName: string): ModuleStats => {
            const perms = permissionsByModule[moduleName] || [];
            const total = perms.length;
            const assigned = perms.filter((p) => data.permissions.includes(p.id)).length;
            return { assigned, total };
        },
        [permissionsByModule, data.permissions]
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
        if (!activeModuleTab || !permissionsByModule[activeModuleTab]) return;

        const currentModulePermIds = permissionsByModule[activeModuleTab].map((p) => p.id);
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

    const currentModulePermissions = permissionsByModule[activeModuleTab] || [];
    const isSystemRole = role.is_system;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="bg-white rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 shrink-0 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                isSystemRole
                                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                                    : 'bg-red-50 border-red-100 text-red-900'
                            }`}
                        >
                            {isSystemRole ? (
                                <Lock className="w-5 h-5" />
                            ) : (
                                <Sliders className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    Edit Role & Permissions
                                </h3>
                                {isSystemRole ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                        System Role
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                        Custom Role
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                Configure title and granular capabilities for{' '}
                                <strong className="text-gray-800 font-semibold">{role.name}</strong>.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="edit-role-form"
                    onSubmit={handleSubmit}
                    className="overflow-y-auto grow p-4 sm:p-6 space-y-5 flex flex-col"
                >
                    {/* Role Name Field */}
                    <div className="bg-gray-50/70 border border-gray-200/90 rounded-lg p-4">
                        <label
                            htmlFor="edit-role-name"
                            className="block mb-1.5 text-xs font-semibold text-gray-700"
                        >
                            Role Name <span className="text-red-600">*</span>
                        </label>
                        <div className="relative max-w-md">
                            <input
                                type="text"
                                id="edit-role-name"
                                value={data.name}
                                disabled={isSystemRole}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`bg-white border text-gray-900 text-xs rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 block w-full p-2.5 transition-all ${
                                    isSystemRole
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 pl-8'
                                        : errors.name
                                        ? 'border-red-500'
                                        : 'border-gray-300'
                                }`}
                                required
                            />
                            {isSystemRole && (
                                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
                        {errors.name && (
                            <p className="text-[11px] text-red-600 mt-1 font-medium">
                                {errors.name}
                            </p>
                        )}
                        {isSystemRole && (
                            <p className="text-[11px] text-gray-500 mt-1.5">
                                System role names are protected and cannot be changed.
                            </p>
                        )}
                    </div>

                    {/* Permission Section Header */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Permission Assignments
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Select the operational actions permitted for this role across system modules.
                        </p>
                    </div>

                    {/* Two-Column Permission Layout (Tablet & Desktop: md:flex) */}
                    <div className="border border-gray-200/90 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[400px] shadow-2xs">
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
                </form>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-200 shrink-0 gap-3 bg-gray-50/80 sticky bottom-0">
                    <div className="text-xs text-gray-600 text-center sm:text-left">
                        <span className="font-semibold text-gray-900">
                            {data.permissions.length} of {totalSystemPermissionsCount}
                        </span>{' '}
                        permissions assigned
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="edit-role-form"
                            disabled={processing || !data.name.trim()}
                            className="w-full sm:w-auto px-4 py-2 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
