import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Activity, Archive, CircleHelp, Database, HardDrive, Mail, ShieldCheck, Users, Wrench } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardContent from '@/Layouts/DashboardContent';
import { getSidebarModules } from '@/utils/sidebarConfig';
import DashboardControls from '@/Components/DashboardControls';
import { SYSTEM_ADMIN_TOUR_START_EVENT } from './systemAdminWalkthrough';

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
type SupplyOverview = {
    summary: { total_inventory_value: number; available_items: number; issued_this_month: number; critical_stock: number; unserviceable: number };
    stats: { totalRisIssued: number; activeInventoryItems: number };
    criticalStock: { id: number; name: string; current: number; min: number; unit: string; status: string }[];
    recentReceiving: { id: number; item_name: string; quantity: number; unit: string; supplier: string; received_at: string }[];
    recentIssuance: { id: number; item_name: string; quantity?: number; total_items: number; unit: string; department: string; issued_at: string }[];
    requestSummary: Record<string, number>;
};

const formatBytes = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return 'Unavailable';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value; let unit = 0;
    while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
    return `${size.toFixed(unit > 1 ? 1 : 0)} ${units[unit]} free`;
};

export default function SystemDashboard({ auth, adminOverview, recentAdminActivity = [], supplyOverview }: {
    auth: { user: { name: string } };
    adminOverview: Overview;
    recentAdminActivity?: ActivityItem[];
    supplyOverview: SupplyOverview;
}) {
    const requestCount = (statuses: string[]) => statuses.reduce((sum, status) => sum + Number(supplyOverview.requestSummary[status] || 0), 0);
    const pendingRequests = requestCount(['Pending', 'Pending Verification', 'For Correction', 'Under Review']);
    const approvedRequests = requestCount(['Approved', 'Ready for Pickup']);
    const issuedRequests = requestCount(['Issued', 'Released']);
    const rejectedRequests = requestCount(['Rejected']);
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
                <header data-tour="system-admin-dashboard-header" className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">System Administration</p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">System overview</h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Technical status, account administration, and security activity.</p>
                    </div>
                    <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
                        <button type="button" data-tour="system-admin-guide-start" onClick={() => window.dispatchEvent(new Event(SYSTEM_ADMIN_TOUR_START_EVENT))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-red-800 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white"><CircleHelp size={17} aria-hidden="true" />Walkthrough Guide</button>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${adminOverview.databaseStatus === 'Connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><Activity size={16} /> Database {adminOverview.databaseStatus.toLowerCase()}</span>
                        <DashboardControls className="w-auto" />
                    </div>
                </header>

                <section data-tour="system-admin-dashboard-status" aria-label="System status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><Icon size={19} className="text-blue-700" /></div>
                        <p className="mt-3 break-words text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                    </article>)}
                </section>

                <section data-tour="system-admin-supply-overview" aria-label="Organization-wide supply overview" className="mt-8">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Supply Operations</p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Organization-wide supply overview</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Inventory, requisition progress, and recent stock movement across the system.</p>
                        </div>
                        <Link href={route('inventory.requests.index')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">View requisitions</Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                            ['Supply items', supplyOverview.stats.activeInventoryItems],
                            ['Low / critical stock', supplyOverview.summary.critical_stock],
                            ['Out of stock', supplyOverview.summary.unserviceable],
                            ['Pending requisitions', pendingRequests],
                            ['Approved / awaiting release', approvedRequests],
                        ].map(([label, value]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{Number(value).toLocaleString()}</p></article>)}
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Requisition status</h3><Link href={route('inventory.requests.index')} className="text-sm font-medium text-blue-700 hover:underline">Open requests</Link></div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                {([['Pending', pendingRequests], ['Approved', approvedRequests], ['Issued', issuedRequests], ['Rejected', rejectedRequests]] as const).map(([label, count]) => <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 text-xl font-bold">{count.toLocaleString()}</dd></div>)}
                            </dl>
                        </article>
                        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Stock requiring attention</h3><Link href={route('inventory.index')} className="text-sm font-medium text-blue-700 hover:underline">View inventory</Link></div>
                            {supplyOverview.criticalStock.length ? <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{supplyOverview.criticalStock.map(item => <li key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate font-medium">{item.name}</span><span className="shrink-0 text-rose-700 dark:text-rose-300">{item.current} {item.unit} · {item.status}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No items are currently below their stock threshold.</p>}
                        </article>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {[{ title: 'Recent receiving', items: supplyOverview.recentReceiving.map(item => ({ id: item.id, name: item.item_name, detail: `${item.supplier} · ${item.received_at}`, quantity: `+${item.quantity} ${item.unit}` })) }, { title: 'Recent issuance', items: supplyOverview.recentIssuance.map(item => ({ id: item.id, name: item.item_name, detail: `${item.department} · ${item.issued_at}`, quantity: `−${item.total_items} ${item.unit}` })) }].map(section => <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="font-semibold">{section.title}</h3>{section.items.length ? <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{section.items.slice(0, 4).map(item => <li key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{item.name}</span><span className="block truncate text-slate-500">{item.detail}</span></span><span className="shrink-0 font-semibold">{item.quantity}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No recent records.</p>}</article>)}
                    </div>
                </section>

                <section className="mt-5 grid gap-4 lg:grid-cols-3">
                    <article data-tour="system-admin-runtime-checks" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 font-semibold"><HardDrive size={18} className="text-blue-700" /> Runtime checks</div>
                        <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Failed background jobs</dt><dd className="font-medium">{adminOverview.failedJobs === null ? 'Unavailable' : adminOverview.failedJobs}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Storage</dt><dd className="font-medium">{formatBytes(adminOverview.storageFreeBytes)}</dd></div></dl>
                    </article>
                    <article data-tour="system-admin-backup-status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/30 lg:col-span-2">
                        <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-200"><Archive size={18} /> Backup status</div>
                        <p className="mt-3 text-sm text-amber-900 dark:text-amber-100">{adminOverview.backupStatus}</p>
                        <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Backups are retained for 30 days. The scheduler must run for the daily 02:00 backup to execute; restore is an audited command-line operation.</p>
                    </article>
                </section>

                <nav data-tour="system-admin-shortcuts" aria-label="System administration tasks" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

                <section data-tour="system-admin-recent-activity" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-700" /><h2 className="font-semibold">Recent system activity</h2></div>
                    {recentAdminActivity.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{recentAdminActivity.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 text-sm"><span className="font-medium">{item.action || 'System event'} <span className="font-normal text-slate-500">· {item.module}</span></span><span className="text-slate-500">{item.actor}{item.created_at ? ` · ${new Date(item.created_at).toLocaleString()}` : ''}</span></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No recent activity is available.</p>}
                </section>
                <p className="mt-4 text-right text-xs text-slate-500">Checked {new Date(adminOverview.checkedAt).toLocaleString()}</p>
            </DashboardContent>
        </DashboardLayout>
    </>;
}
