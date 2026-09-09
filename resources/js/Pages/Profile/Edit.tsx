import React, { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';
import StatusBadge from '@/Components/Common/StatusBadge';
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
    Calendar,
    Mail,
    CheckCircle2
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
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Account Settings — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={authUser}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area */}
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

                    {/* Top Institutional Bar */}
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

                    {/* Main Header Content */}
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

                {/* Main Content Area */}
                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Compact Institutional Identity Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-900 to-red-950 text-amber-300 border border-red-800 shadow-sm flex items-center justify-center font-bold text-xl select-none shrink-0 font-serif">
                                {resolvedProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg font-bold text-gray-900 font-serif tracking-tight">
                                        {resolvedProfile.name}
                                    </h1>
                                    <StatusBadge status={resolvedProfile.account_status || 'Active'} />
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-red-50 text-red-900 border border-red-200">
                                        {resolvedProfile.role}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 font-mono">
                                    <span>@{resolvedProfile.username}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-gray-400" />
                                        {resolvedProfile.email}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        Joined {resolvedProfile.created_at_formatted}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Password Switch Shortcut */}
                        {activeTab !== 'password' && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('password')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-gray-700 hover:text-red-950 border border-gray-300 hover:border-red-900 rounded-md text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
                            >
                                <KeyRound className="w-3.5 h-3.5 text-red-900" />
                                Change Password
                            </button>
                        )}
                    </div>

                    {/* Segmented Institutional Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8" aria-label="Account Settings Tabs">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'border-red-900 text-red-950 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                Profile Information
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('password')}
                                className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                    activeTab === 'password'
                                        ? 'border-red-900 text-red-950 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <KeyRound className="w-4 h-4" />
                                Change Password
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('security')}
                                className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                    activeTab === 'security'
                                        ? 'border-red-900 text-red-950 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Security & Audit
                            </button>
                        </nav>
                    </div>

                    {/* Active Tab Panel */}
                    <div>
                        {activeTab === 'profile' && (
                            <UpdateProfileInformationCard
                                profile={resolvedProfile}
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        )}

                        {activeTab === 'password' && (
                            <UpdatePasswordCard userEmail={resolvedProfile.email} />
                        )}

                        {activeTab === 'security' && (
                            <AccountSecurityCard profile={resolvedProfile} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
