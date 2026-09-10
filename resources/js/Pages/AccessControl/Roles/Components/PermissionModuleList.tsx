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
            <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50/60">
                <label
                    htmlFor="mobile-module-selector"
                    className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                    System Module
                </label>
                <select
                    id="mobile-module-selector"
                    value={activeModule}
                    onChange={(e) => onSelectModule(e.target.value)}
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-red-900 focus:border-red-900 bg-white shadow-2xs"
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
            <div className="hidden md:block w-64 bg-gray-50/70 border-r border-gray-200 shrink-0 overflow-y-auto max-h-[460px]">
                <div className="px-4 py-3 border-b border-gray-200/80 bg-gray-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-700">
                        <Layers className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            Modules
                        </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-semibold bg-gray-200/70 px-1.5 py-0.2 rounded">
                        {modules.length}
                    </span>
                </div>

                <nav aria-label="Modules navigation" className="p-2 space-y-1">
                    {modules.map((mod) => {
                        const isSelected = mod === activeModule;
                        const stats = getModuleStats(mod);
                        const isComplete = stats.total > 0 && stats.assigned === stats.total;

                        return (
                            <button
                                key={mod}
                                type="button"
                                onClick={() => onSelectModule(mod)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all text-left cursor-pointer ${
                                    isSelected
                                        ? 'bg-red-950 text-white font-semibold shadow-2xs'
                                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 font-medium'
                                }`}
                            >
                                <span className="truncate pr-1">{mod}</span>
                                <span
                                    className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded border transition-colors ${
                                        isSelected
                                            ? 'bg-red-900/70 text-white border-red-800/80 font-semibold'
                                            : isComplete
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                                            : stats.assigned > 0
                                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                                            : 'bg-gray-100/60 text-gray-400 border-gray-200/60'
                                    }`}
                                >
                                    {stats.assigned} / {stats.total}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}

