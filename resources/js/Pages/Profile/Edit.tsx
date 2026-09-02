import React, { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { PageProps, UserProfileDetails } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import UpdateProfileInformationCard from './Partials/UpdateProfileInformationCard';
import UpdatePasswordCard from './Partials/UpdatePasswordCard';
import AccountSecurityCard from './Partials/AccountSecurityCard';
import {
    User,
    KeyRound,
    ShieldCheck,
    Shield,
    CheckCircle2,
    Calendar,
    Mail,
    Sparkles
} from 'lucide-react';

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
    profile?: UserProfileDetails;
};

export default function Edit({
    mustVerifyEmail,
    status,
    profile,
}: PageProps<Props>) {
    const pageProps = usePage().props as any;
    const authUser = pageProps.auth?.user;

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    // Gracefully resolve profile data with fallback to authUser
    const resolvedProfile: UserProfileDetails = profile || {
        id: authUser?.id ?? 1,
        name: authUser?.name ?? 'User',
        username: authUser?.username || authUser?.email?.split('@')[0] || 'user',
        email: authUser?.email ?? 'user@ucn.edu.ph',
        email_verified_at: authUser?.email_verified_at,
        role: authUser?.role || (Array.isArray(authUser?.roles) ? authUser.roles[0] : 'Supply Officer'),
        roles: Array.isArray(authUser?.roles) ? authUser.roles : [authUser?.role || 'Supply Officer'],
        is_active: authUser?.is_active ?? true,
        account_status: (authUser?.is_active ?? true) ? 'Active' : 'Inactive',
        created_at_formatted: authUser?.created_at_formatted || 'System Initial Setup',
        created_at_diff: 'Official Record',
        last_login: null,
        login_history: [],
        active_sessions: [],
    };

    const modules = getSidebarModules('Account Settings');
    const systemMode = pageProps.system?.mode || 'LIVE PRODUCTION';
    const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'password' | 'security'>('all');

    const scrollToSection = (sectionId: string, tabKey: 'all' | 'profile' | 'password' | 'security') => {
        setActiveTab(tabKey);
        if (sectionId) {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Account Settings — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={authUser}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area (Matches Dashboard Layout) */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Non-Production Mode Alert Banner */}
                    {systemMode !== 'LIVE PRODUCTION' && (
                        <div
                            className={`px-6 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
                                systemMode === 'MAINTENANCE MODE'
                                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                                    : systemMode === 'STAGING SANDBOX'
                                    ? 'bg-sky-950 text-sky-300 border-sky-800'
                                    : 'bg-purple-950 text-purple-300 border-purple-800'
                            }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                            <span>
                                {systemMode === 'MAINTENANCE MODE' &&
                                    'SYSTEM MAINTENANCE MODE ACTIVE — Data mutations restricted to System Administrators.'}
                                {systemMode === 'STAGING SANDBOX' &&
                                    'STAGING SANDBOX ENVIRONMENT — Operating with isolated test database records.'}
                                {systemMode === 'TRAINING SIMULATION' &&
                                    'TRAINING SIMULATION MODE — Operating with synthetic demo data.'}
                            </span>
                        </div>
                    )}

                    {/* Top Institutional Bar (Identical to Dashboard) */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">
                                Supply & Property Management Office (SPMO)
                            </span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">
                                Supply and Inventory Management System (SIMS)
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content (Identical to Dashboard) */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs
                                    items={[
                                        { name: 'Account Settings' },
                                    ]}
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">
                                Account Settings
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Personal Identity Details, Security Credentials & Institutional Audit Records
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area (Matches Dashboard Max-Width & Spacing) */}
                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Welcome / User Profile Hero Banner (Matches Dashboard Welcome Banner) */}
                    <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-400 p-6 lg:p-7 shadow-xs relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="max-w-3xl space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-900/90 border border-red-800 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Account Security Status: Operational & Audited
                                </div>

                                <div className="flex items-center gap-5 pt-1">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 border-2 border-yellow-300 shadow-md flex items-center justify-center text-red-950 font-black text-2xl sm:text-3xl shrink-0 select-none">
                                        {resolvedProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-2xl lg:text-3xl font-bold font-serif leading-tight text-white tracking-tight truncate">
                                            {resolvedProfile.name}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-red-100/90 font-medium font-mono">
                                            <span className="text-amber-300 font-bold">@{resolvedProfile.username}</span>
                                            <span>•</span>
                                            <span className="truncate">{resolvedProfile.email}</span>
                                            <span>•</span>
                                            <span className="text-amber-300 font-bold uppercase">{resolvedProfile.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-red-100/85 text-xs font-normal leading-relaxed pt-0.5">
                                    Authenticated personnel account under the Supply & Property Management System. Provisioned on{' '}
                                    <strong className="text-amber-300 font-semibold">{resolvedProfile.created_at_formatted}</strong>.
                                    Self-deactivation is restricted in compliance with COA & SPMO institutional audit regulations.
                                </p>
                            </div>

                            <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('section-password', 'password')}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 text-red-950 rounded font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-xs border border-amber-300 cursor-pointer"
                                >
                                    <span>Change Password</span>
                                    <KeyRound className="w-4 h-4 text-red-950" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Statistics Grid (Matches Dashboard Top Stat Cards) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Account Status',
                                value: resolvedProfile.account_status,
                                sub: 'Access Active & Verified',
                                trend: 'Active',
                                trendUp: true,
                                icon: (
                                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                                ),
                            },
                            {
                                label: 'Assigned Role',
                                value: resolvedProfile.role,
                                sub: 'RBAC Authorization Matrix',
                                trend: 'Role',
                                trendUp: true,
                                icon: (
                                    <Shield className="w-4 h-4 text-red-900" />
                                ),
                            },
                            {
                                label: 'Email Verification',
                                value: resolvedProfile.email_verified_at ? 'Verified' : 'Pending',
                                sub: resolvedProfile.email,
                                trend: resolvedProfile.email_verified_at ? 'Valid' : 'Pending',
                                trendUp: Boolean(resolvedProfile.email_verified_at),
                                icon: (
                                    <Mail className="w-4 h-4 text-red-900" />
                                ),
                            },
                            {
                                label: 'Date Joined',
                                value: resolvedProfile.created_at_formatted,
                                sub: resolvedProfile.created_at_diff || 'Official Record',
                                trend: 'Member',
                                trendUp: true,
                                icon: (
                                    <Calendar className="w-4 h-4 text-red-900" />
                                ),
                            },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start mb-2.5">
                                    <div className="p-2 rounded bg-red-50 border border-gray-200">
                                        {stat.icon}
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                            stat.trendUp
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                                        }`}
                                    >
                                        {stat.trend}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight font-sans truncate">
                                        {stat.value}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-700 truncate uppercase tracking-wider mt-1">
                                        {stat.label}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">
                                        {stat.sub}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Segmented Tab Switcher (Matches Dashboard Apple/Linear Style) */}
                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
                        <div className="inline-flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 shadow-2xs text-xs overflow-x-auto max-w-full">
                            <button
                                type="button"
                                onClick={() => scrollToSection('', 'all')}
                                className={`px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === 'all'
                                        ? 'font-bold bg-white text-red-950 shadow-xs border border-slate-200/60'
                                        : 'font-semibold text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All Settings
                            </button>

                            <button
                                type="button"
                                onClick={() => scrollToSection('section-profile', 'profile')}
                                className={`px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'font-bold bg-white text-red-950 shadow-xs border border-slate-200/60'
                                        : 'font-semibold text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Profile Information
                            </button>

                            <button
                                type="button"
                                onClick={() => scrollToSection('section-password', 'password')}
                                className={`px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === 'password'
                                        ? 'font-bold bg-white text-red-950 shadow-xs border border-slate-200/60'
                                        : 'font-semibold text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Change Password
                            </button>

                            <button
                                type="button"
                                onClick={() => scrollToSection('section-security', 'security')}
                                className={`px-4 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === 'security'
                                        ? 'font-bold bg-white text-red-950 shadow-xs border border-slate-200/60'
                                        : 'font-semibold text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Security & Audit
                            </button>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>UCN SIMS v2.0</span>
                        </div>
                    </div>

                    {/* Section Cards */}
                    <div className="space-y-6">
                        {/* SECTION 1: PROFILE INFORMATION */}
                        <div id="section-profile" className="scroll-mt-36">
                            <UpdateProfileInformationCard
                                profile={resolvedProfile}
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        {/* SECTION 2: CHANGE PASSWORD */}
                        <div id="section-password" className="scroll-mt-36">
                            <UpdatePasswordCard userEmail={resolvedProfile.email} />
                        </div>

                        {/* SECTION 3: ACCOUNT SECURITY & AUDIT */}
                        <div id="section-security" className="scroll-mt-36">
                            <AccountSecurityCard profile={resolvedProfile} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
