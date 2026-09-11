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
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
    {
        id: 'profile',
        label: 'Personnel Information',
        subtitle: 'Official Records',
        icon: User,
    },
    {
        id: 'security',
        label: 'Security Credentials',
        subtitle: 'OTP Protected',
        icon: KeyRound,
    },
    {
        id: 'audit',
        label: 'Authentication & Audit',
        subtitle: 'Activity Ledger',
        icon: ShieldCheck,
    },
];

export default function ProfileTabBar({ activeTab, onTabChange }: Props) {
    return (
        <div className="mb-6">
            <div className="p-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 inline-flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto shadow-2xs">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer select-none text-left ${
                                isActive
                                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/90'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isActive
                                        ? 'bg-red-900 text-white shadow-2xs'
                                        : 'bg-slate-200/70 text-slate-500'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 pr-1">
                                <div className="leading-tight font-sans tracking-tight">
                                    {tab.label}
                                </div>
                                <div className={`text-[10px] font-mono leading-none mt-0.5 ${isActive ? 'text-red-900 font-semibold' : 'text-slate-400'}`}>
                                    {tab.subtitle}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
