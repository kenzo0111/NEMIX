import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Permission } from '../types';
import { formatActionLabel } from '../permissionMetadata';

interface PermissionListProps {
    moduleName: string;
    permissions: Permission[];
    assignedPermissionIds: number[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onTogglePermission: (permissionId: number) => void;
    onSelectAllModule: (selectAll: boolean) => void;
}

export default function PermissionList({
    moduleName,
    permissions,
    assignedPermissionIds,
    searchQuery,
    onSearchChange,
    onTogglePermission,
    onSelectAllModule,
}: PermissionListProps) {
    const allPermIds = useMemo(() => permissions.map((p) => p.id), [permissions]);
    const isAllSelected =
        allPermIds.length > 0 && allPermIds.every((id) => assignedPermissionIds.includes(id));
    const isPartiallySelected =
        !isAllSelected && allPermIds.some((id) => assignedPermissionIds.includes(id));

    const filteredPermissions = useMemo(() => {
        if (!searchQuery.trim()) return permissions;
        const q = searchQuery.toLowerCase();
        return permissions.filter(
            (p) =>
                p.display_name.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.action.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
        );
    }, [permissions, searchQuery]);

    return (
        <div className="flex-1 p-5 overflow-y-auto max-h-[460px] flex flex-col justify-between bg-white">
            <div className="space-y-4">
                {/* Module Header & Select-All Control */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">
                                {moduleName}
                            </h4>
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {permissions.length} capabilities
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage granular capabilities and operational actions for {moduleName}.
                        </p>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                                if (el) el.indeterminate = isPartiallySelected;
                            }}
                            onChange={(e) => onSelectAllModule(e.target.checked)}
                            className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900 focus:ring-1 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                            Select all in {moduleName}
                        </span>
                    </label>
                </div>

                {/* Sub-Search within Selected Module (if > 4 items) */}
                {permissions.length > 4 && (
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={`Search permissions in ${moduleName}...`}
                            aria-label={`Search permissions in ${moduleName}`}
                            className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-gray-50/50 placeholder:text-gray-400"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                aria-label="Clear filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* Permission Rows */}
                {filteredPermissions.length > 0 ? (
                    <div className="space-y-2">
                        {filteredPermissions.map((perm) => {
                            const isChecked = assignedPermissionIds.includes(perm.id);

                            return (
                                <label
                                    key={perm.id}
                                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isChecked
                                            ? 'bg-red-50/20 border-red-200'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => onTogglePermission(perm.id)}
                                            className="w-4 h-4 mt-0.5 text-red-900 border-gray-300 rounded focus:ring-red-900 focus:ring-1 cursor-pointer shrink-0"
                                        />
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span
                                                className={`text-xs ${
                                                    isChecked
                                                        ? 'text-gray-900 font-bold'
                                                        : 'text-gray-800 font-semibold'
                                                }`}
                                            >
                                                {perm.display_name}
                                            </span>

                                            {perm.description && (
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                                                    {perm.description}
                                                </p>
                                            )}

                                            <span className="text-[10px] text-gray-400 font-mono mt-1">
                                                {perm.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-2">
                                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">
                                            {formatActionLabel(perm.action)}
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 text-xs">
                        {searchQuery ? (
                            <div className="flex flex-col items-center gap-1.5">
                                <Search className="w-5 h-5 text-gray-300" />
                                <span>No permissions match "{searchQuery}"</span>
                                <button
                                    type="button"
                                    onClick={() => onSearchChange('')}
                                    className="text-xs text-red-900 font-semibold hover:underline mt-1"
                                >
                                    Clear search filter
                                </button>
                            </div>
                        ) : (
                            'No permissions available under this module.'
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
