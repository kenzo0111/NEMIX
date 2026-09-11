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
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 overflow-x-auto scrollbar-none mb-6"
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
                            <span>{tab.label}</span>
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
