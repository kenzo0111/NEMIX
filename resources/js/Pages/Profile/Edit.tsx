import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import Breadcrumbs from '@/Components/Breadcrumbs';
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
    CheckCircle2,
    Clock,
    Shield,
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
    const { auth } = usePage<PageProps>().props;

    // Gracefully resolve profile data with fallback to auth.user
    const resolvedProfile: UserProfileDetails = profile || {
        id: auth.user.id,
        name: auth.user.name,
        username: auth.user.username || auth.user.email.split('@')[0] || 'user',
        email: auth.user.email,
        email_verified_at: auth.user.email_verified_at,
        role: auth.user.role || (Array.isArray(auth.user.roles) ? auth.user.roles[0] : 'Supply Officer'),
        roles: Array.isArray(auth.user.roles) ? auth.user.roles : [auth.user.role || 'Supply Officer'],
        is_active: auth.user.is_active ?? true,
        account_status: (auth.user.is_active ?? true) ? 'Active' : 'Inactive',
        created_at_formatted: auth.user.created_at_formatted || 'System Initial Setup',
        created_at_diff: 'Official Record',
        last_login: null,
        login_history: [],
        active_sessions: [],
    };

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
        <AppLayout
            title="Account Settings"
            activeModule="Account Settings"
            breadcrumbs={
                <Breadcrumbs
                    items={[
                        { name: 'System Settings', href: route('dashboard') },
                        { name: 'Account Settings' },
                    ]}
                />
            }
        >
            <Head title="Account Settings — UCN SPMO" />

            <div className="space-y-6 pb-12">
                {/* 1. INSTITUTIONAL PROFILE HERO BANNER */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-red-900/80">
                    {/* Background Texture & Glow Elements */}
                    <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Avatar & User Details */}
                        <div className="flex items-center gap-5 sm:gap-6 min-w-0">
                            {/* Profile Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 border-2 border-yellow-300 shadow-xl shadow-black/40 flex items-center justify-center text-red-950 font-black text-3xl sm:text-4xl select-none">
                                    {resolvedProfile.name ? resolvedProfile.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-red-950 shadow-md"
                                    title="Account Online & Active"
                                ></span>
                            </div>

                            {/* Text Info */}
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm truncate">
                                        {resolvedProfile.name}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400 text-red-950 shadow-sm">
                                        {resolvedProfile.role}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        {resolvedProfile.account_status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-red-200/90 font-medium">
                                    <span className="font-mono text-amber-300">
                                        @{resolvedProfile.username}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-red-300/80" />
                                        {resolvedProfile.email}
                                    </span>
                                </div>

                                {/* Meta pills */}
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-red-200/70">
                                    <div className="flex items-center gap-1.5 bg-red-900/40 px-2.5 py-1 rounded-lg border border-red-800/50">
                                        <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                                        <span>Joined {resolvedProfile.created_at_formatted}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-red-900/40 px-2.5 py-1 rounded-lg border border-red-800/50">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{resolvedProfile.email_verified_at ? 'Email Verified' : 'Unverified'}</span>
                                    </div>
                                    {resolvedProfile.last_login && (
                                        <div className="flex items-center gap-1.5 bg-red-900/40 px-2.5 py-1 rounded-lg border border-red-800/50">
                                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                                            <span>Active {resolvedProfile.last_login.time_ago}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Institutional Badge / Department tag */}
                        <div className="hidden lg:block text-right shrink-0">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs font-bold text-amber-300 font-mono shadow-inner">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span>SPMO AUTHENTICATED</span>
                            </div>
                            <p className="text-[10px] text-red-300/60 mt-1 uppercase tracking-widest font-mono">
                                University of Caloocan City
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. SECTION QUICK JUMP TABS */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => scrollToSection('', 'all')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-red-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        <span>All Settings</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollToSection('section-profile', 'profile')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'profile'
                                ? 'bg-red-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>Profile Information</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollToSection('section-password', 'password')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'password'
                                ? 'bg-red-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Change Password</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollToSection('section-security', 'security')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'security'
                                ? 'bg-red-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Security & Governance</span>
                    </button>
                </div>

                {/* 3. SETTINGS CARDS CONTAINER */}
                <div className="space-y-8">
                    {/* SECTION 1: PROFILE INFORMATION */}
                    <div id="section-profile" className="scroll-mt-24">
                        <UpdateProfileInformationCard
                            profile={resolvedProfile}
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    {/* SECTION 2: CHANGE PASSWORD */}
                    <div id="section-password" className="scroll-mt-24">
                        <UpdatePasswordCard />
                    </div>

                    {/* SECTION 3: ACCOUNT SECURITY & AUDIT */}
                    <div id="section-security" className="scroll-mt-24">
                        <AccountSecurityCard profile={resolvedProfile} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
