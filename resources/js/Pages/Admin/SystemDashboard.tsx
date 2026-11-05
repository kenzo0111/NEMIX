import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Activity, Archive, Database, HardDrive, Mail, ShieldCheck, Users, Wrench } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardContent from '@/Layouts/DashboardContent';
import { getSidebarModules } from '@/utils/sidebarConfig';

type Overview = {
    totalUsers: number | string;
    activeUsers: number | string;
    databaseStatus: string;
    emailStatus: string;
    failedJobs: number | null;
    storageFreeBytes: number | null;
    systemMode: string;
    backupStatus: string;
    checkedAt: string;
};

type ActivityItem = { id: number; action: string; module: string; actor: string; created_at: string | null; status: string | null };

const formatBytes = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return 'Unavailable';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value; let unit = 0;
    while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
    return `${size.toFixed(unit > 1 ? 1 : 0)} ${units[unit]} free`;
};

export default function SystemDashboard({ auth, adminOverview, recentAdminActivity = [] }: {
    auth: { user: { name: string } };
    adminOverview: Overview;
    recentAdminActivity?: ActivityItem[];
}) {
    const cards = [
        { label: 'Total users', value: adminOverview.totalUsers, detail: `${adminOverview.activeUsers} active`, icon: Users },
        { label: 'Database', value: adminOverview.databaseStatus, detail: 'Live connection check', icon: Database },
        { label: 'Email service', value: adminOverview.emailStatus, detail: 'Configuration status', icon: Mail },
        { label: 'Operating mode', value: adminOverview.systemMode, detail: 'Current system mode', icon: Wrench },
    ];

    return <>
        <Head title="System Administration" />
        <DashboardLayout modules={getSidebarModules()} user={auth.user}>
            <DashboardContent>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">System Administration</p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">System overview</h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Technical status, account administration, and security activity.</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${adminOverview.databaseStatus === 'Connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><Activity size={16} /> Database {adminOverview.databaseStatus.toLowerCase()}</span>
                </header>

                <section aria-label="System status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><Icon size={19} className="text-blue-700" /></div>
                        <p className="mt-3 break-words text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                    </article>)}
                </section>

                <section className="mt-5 grid gap-4 lg:grid-cols-3">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 font-semibold"><HardDrive size={18} className="text-blue-700" /> Runtime checks</div>
                        <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Failed background jobs</dt><dd className="font-medium">{adminOverview.failedJobs === null ? 'Unavailable' : adminOverview.failedJobs}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Storage</dt><dd className="font-medium">{formatBytes(adminOverview.storageFreeBytes)}</dd></div></dl>
                    </article>
                    <article className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/30 lg:col-span-2">
                        <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-200"><Archive size={18} /> Backup status</div>
                        <p className="mt-3 text-sm text-amber-900 dark:text-amber-100">{adminOverview.backupStatus}</p>
                        <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Backups are retained for 30 days. The scheduler must run for the daily 02:00 backup to execute; restore is an audited command-line operation.</p>
                    </article>
                </section>

                <nav aria-label="System administration tasks" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="font-semibold">Administration shortcuts</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('access-control.staffs')}>User Management</Link>
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('access-control.role-permission')}>Roles &amp; Permissions</Link>
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('system.settings.index')}>System Settings</Link>
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('system.settings.index', { tab: 'operations' })}>Diagnostics, Security &amp; Backup</Link>
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('audit-logs.login-trails')}>Login Audit</Link>
                        <Link className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={route('audit-logs.transaction-trails')}>Activity Audit</Link>
                    </div>
                </nav>

                <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-700" /><h2 className="font-semibold">Recent system activity</h2></div>
                    {recentAdminActivity.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{recentAdminActivity.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 text-sm"><span className="font-medium">{item.action || 'System event'} <span className="font-normal text-slate-500">· {item.module}</span></span><span className="text-slate-500">{item.actor}{item.created_at ? ` · ${new Date(item.created_at).toLocaleString()}` : ''}</span></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No recent activity is available.</p>}
                </section>
                <p className="mt-4 text-right text-xs text-slate-500">Checked {new Date(adminOverview.checkedAt).toLocaleString()}</p>
            </DashboardContent>
        </DashboardLayout>
    </>;
}
