import React, { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { PageProps } from '@/types';
import { ProfilePageProps, UserProfileDetails, ProfileTab } from './types';
import { Head, usePage } from '@inertiajs/react';
import PersonnelHeader from './components/PersonnelHeader';
import ProfileTabBar from './components/ProfileTabBar';
import UpdateProfileInformationCard from './Partials/UpdateProfileInformationCard';
import UpdatePasswordCard from './Partials/UpdatePasswordCard';
import AccountSecurityCard from './Partials/AccountSecurityCard';

export default function Edit({
    mustVerifyEmail,
    status,
    profile,
}: PageProps<ProfilePageProps>) {
    const { auth } = usePage<PageProps>().props;
    const authUser = auth?.user;

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

    // Strongly typed resolved profile with fallbacks
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
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-red-900 selection:text-white">
            <Head title="Profile & Account Settings — UCN SPMO" />

            {/* Persistent University Sidebar */}
            <Sidebar
                modules={modules}
                user={authUser}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area */}
            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Unified Institutional Page Header */}
                <PageHeader
                    title="Profile & Account Settings"
                    description="Manage your university personnel information, security credentials, and account activity"
                    breadcrumbs={[{ name: 'Account Settings' }]}
                />

                {/* Primary Content Container */}
                <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-16">
                    {/* Institutional Personnel Header */}
                    <PersonnelHeader profile={resolvedProfile} />

                    {/* Stateful University Tab Switcher */}
                    <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

                    {/* Active Section Host (Mounts only the selected section) */}
                    <div className="transition-opacity duration-150">
                        {activeTab === 'profile' && (
                            <UpdateProfileInformationCard
                                profile={resolvedProfile}
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        )}

                        {activeTab === 'security' && (
                            <UpdatePasswordCard userEmail={resolvedProfile.email} />
                        )}

                        {activeTab === 'audit' && (
                            <AccountSecurityCard profile={resolvedProfile} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
