import { Button } from '@/Components/ui/button';
import React from 'react';
import { Layers } from 'lucide-react';
import { ModuleStats } from '../types';

interface PermissionModuleListProps {
    modules: string[];
    activeModule: string;
    onSelectModule: (moduleName: string) => void;
    getModuleStats: (moduleName: string) => ModuleStats;
}

export default function PermissionModuleList({
    modules,
    activeModule,
    onSelectModule,
    getModuleStats,
}: PermissionModuleListProps) {
    return (
        <>
            {/* Mobile Dropdown View (< md) */}
            <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                <label
                    htmlFor="mobile-module-selector"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                    System Module
                </label>
                <select
                    id="mobile-module-selector"
                    value={activeModule}
                    onChange={(e) => onSelectModule(e.target.value)}
                    className="ui-field w-full text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-900 dark:focus:border-red-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                >
                    {modules.map((mod) => {
                        const stats = getModuleStats(mod);
                        return (
                            <option key={mod} value={mod}>
                                {mod} ({stats.assigned} / {stats.total})
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Desktop / Tablet Vertical Navigation (md:block) */}
            <div className="hidden md:block w-64 bg-slate-50/70 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-800 shrink-0 overflow-y-auto max-h-[460px]">
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-semibold normal-case tracking-normal">
                            Modules
                        </span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                        {modules.length}
                    </span>
                </div>

                <nav aria-label="Modules navigation" className="p-2 space-y-1">
                    {modules.map((mod) => {
                        const isSelected = mod === activeModule;
                        const stats = getModuleStats(mod);
                        const isComplete = stats.total > 0 && stats.assigned === stats.total;

                        return (
                            <Button aria-pressed={isSelected} variant="tab"
                                key={mod}
                                type="button"
                                onClick={() => onSelectModule(mod)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <span className="truncate pr-1">{mod}</span>
                                <span
                                    className={`text-sm tabular-nums shrink-0 px-1.5 py-0.5 rounded border transition-colors ${isSelected
    ? "bg-red-900/70 text-white border-red-800/80 font-semibold" : isComplete
    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 font-semibold" : stats.assigned > 0
    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" : "bg-slate-100/60 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60"}`}
                                >
                                    {stats.assigned} / {stats.total}
                                </span>
                            </Button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}

