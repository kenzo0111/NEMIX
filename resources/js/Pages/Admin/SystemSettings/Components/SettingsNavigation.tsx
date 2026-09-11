import React from 'react';
import { TabId } from '../types';
import { SETTINGS_TABS } from '../tabs';

interface SettingsNavigationProps {
    activeTab: TabId;
    onChange: (tab: TabId) => void;
}

export default function SettingsNavigation({
    activeTab,
    onChange,
}: SettingsNavigationProps) {
    return (
        <nav
            aria-label="Settings Categories"
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 overflow-x-auto scrollbar-none"
        >
            <div className="flex items-center gap-1 min-w-max">
                {SETTINGS_TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-red-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                            }`}
                        >
                            <div
                                className={`p-1 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-red-800 text-amber-300'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                                }`}
                            >
                                <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span>{tab.shortLabel}</span>
                            <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    isActive
                                        ? 'bg-red-950/70 text-red-200'
                                        : 'text-slate-400 bg-slate-100'
                                }`}
                            >
                                {tab.num}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
