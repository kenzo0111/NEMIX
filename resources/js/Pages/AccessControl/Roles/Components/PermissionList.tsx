import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import { Search, CheckCircle2, X } from 'lucide-react';
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

const getActionBadgeColor = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('view') || act.includes('show') || act.includes('index')) {
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50';
    }
    if (act.includes('create') || act.includes('store') || act.includes('add')) {
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('modify')) {
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50';
    }
    if (act.includes('delete') || act.includes('destroy') || act.includes('remove')) {
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50';
    }
    if (act.includes('cancel') || act.includes('reject')) {
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50';
    }
    if (act.includes('release')) {
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/50';
    }
    if (act.includes('approve') || act.includes('verify') || act.includes('audit')) {
        return 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/50';
    }
    if (
        act.includes('export') ||
        act.includes('download') ||
        act.includes('generate') ||
        act.includes('print')
    ) {
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

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
    const assignedInModuleCount = useMemo(
        () => permissions.filter((p) => assignedPermissionIds.includes(p.id)).length,
        [permissions, assignedPermissionIds]
    );

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
        <div className="flex-1 p-5 overflow-y-auto max-h-[460px] flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-4">
                {/* Module Header & Select-All Control */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {moduleName}
                            </h4>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded">
                                {assignedInModuleCount} of {permissions.length} granted
                            </span>
                        </div>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {moduleName === 'Requests'
                                ? 'Choose what staff can do with supply requests. Viewing your own requests and reviewing others are separate permissions.'
                                : `Choose the actions this role can perform in ${moduleName}.`}
                        </p>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                                if (el) el.indeterminate = isPartiallySelected;
                            }}
                            onChange={(e) => onSelectAllModule(e.target.checked)}
                            className="w-4 h-4 text-red-900 border-slate-300 dark:border-slate-600 rounded focus:ring-red-900 focus:ring-1 cursor-pointer dark:text-red-300"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Grant all in {moduleName}
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
                            className="ui-field w-full pl-9 pr-10 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label="Clear filter"
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
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
                                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${isChecked
    ? "bg-red-50/25 dark:bg-red-950/25 border-red-200/90 dark:border-red-900/50 shadow-sm ring-1 ring-red-900/10 dark:ring-red-900/30" : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800"}`}
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => onTogglePermission(perm.id)}
                                            className="w-4 h-4 mt-0.5 text-red-900 border-slate-300 dark:border-slate-600 rounded focus:ring-red-900 focus:ring-1 cursor-pointer shrink-0 dark:text-red-300"
                                        />
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`text-sm ${isChecked
    ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-800 dark:text-slate-200 font-semibold"}`}
                                                >
                                                    {perm.display_name}
                                                </span>
                                                {isChecked && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                )}
                                            </div>

                                            {perm.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                                                    {perm.description}
                                                </p>
                                            )}

                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-2">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 text-sm font-semibold rounded border ${getActionBadgeColor(perm.action)}`}
                                        >
                                            {formatActionLabel(perm.action)}
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        {searchQuery ? (
                            <div className="flex flex-col items-center gap-1.5">
                                <Search className="w-5 h-5 text-slate-300 dark:text-slate-400" />
                                <span>No permissions match "{searchQuery}"</span>
                                <Button variant="secondary"
                                    type="button"
                                    onClick={() => onSearchChange('')}
                                    className="hover:underline mt-1"
                                >
                                    Clear search filter
                                </Button>
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

