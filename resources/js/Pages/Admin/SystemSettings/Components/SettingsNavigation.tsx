import { Button } from '@/Components/ui/button';
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
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-1.5 overflow-x-auto scrollbar-none"
        >
            <div className="flex items-center gap-1 min-w-max">
                {SETTINGS_TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <Button variant="tab" aria-pressed={isActive}
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className="group inline-flex items-center gap-2"
                        >
                            <div
                                className={`p-1 rounded-lg transition-colors ${isActive
    ? "bg-red-800 text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200"}`}
                            >
                                <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span>{tab.shortLabel}</span>
                            <span
                                className={`text-sm tabular-nums px-1.5 py-0.5 rounded ${isActive
    ? "bg-red-950/70 text-red-200" : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"}`}
                            >
                                {tab.num}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </nav>
    );
}
