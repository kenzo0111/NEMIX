import React from 'react';
import { ProfileTab } from '../types';
import { User, KeyRound, ShieldCheck } from 'lucide-react';

interface Props {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}

interface TabItem {
    id: ProfileTab;
    label: string;
    num: string;
    icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
    {
        id: 'profile',
        label: 'Personnel Information',
        num: '01',
        icon: User,
    },
    {
        id: 'security',
        label: 'Security Credentials',
        num: '02',
        icon: KeyRound,
    },
    {
        id: 'audit',
        label: 'Authentication & Audit',
        num: '03',
        icon: ShieldCheck,
    },
];

export default function ProfileTabBar({ activeTab, onTabChange }: Props) {
    return (
        <nav
            aria-label="Profile Categories"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-1.5 overflow-x-auto scrollbar-none mb-6"
        >
            <div className="flex items-center gap-1 min-w-max">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-red-900 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div
                                className={`p-1 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-red-800 text-amber-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                                }`}
                            >
                                <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    isActive
                                        ? 'bg-red-950/70 text-red-200'
                                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
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
