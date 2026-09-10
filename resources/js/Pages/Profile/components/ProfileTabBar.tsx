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
    icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
    { id: 'profile', label: 'Personnel Information', icon: User },
    { id: 'security', label: 'Security Credentials', icon: KeyRound },
    { id: 'audit', label: 'Authentication & Audit', icon: ShieldCheck },
];

export default function ProfileTabBar({ activeTab, onTabChange }: Props) {
    return (
        <div className="border-b border-slate-200 mb-6">
            <nav className="flex space-x-1 sm:space-x-6 overflow-x-auto" aria-label="Profile Sections">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                                isActive
                                    ? 'border-red-900 text-red-950 font-bold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon
                                className={`w-4 h-4 ${
                                    isActive ? 'text-red-900' : 'text-slate-400'
                                }`}
                            />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
