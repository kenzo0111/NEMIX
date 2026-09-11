import React from 'react';
import { TabMeta } from '../types';

interface SettingsSectionHeaderProps {
    tab: TabMeta;
}

export default function SettingsSectionHeader({ tab }: SettingsSectionHeaderProps) {
    const IconComponent = tab.icon;

    return (
        <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-900 flex items-center justify-center shrink-0 border border-red-100">
                    <IconComponent className="w-4 h-4 text-red-900" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold text-red-900 bg-red-100/70 px-1.5 py-0.5 rounded uppercase">
                            Section {tab.num}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight font-serif">
                            {tab.label}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {tab.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
