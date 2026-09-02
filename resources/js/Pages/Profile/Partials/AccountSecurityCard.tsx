import React from 'react';
import { UserProfileDetails } from '@/types';
import {
    ShieldCheck,
    ShieldAlert,
    Clock,
    Globe,
    Laptop,
    Smartphone,
    Activity,
    CheckCircle2
} from 'lucide-react';

interface Props {
    profile: UserProfileDetails;
    className?: string;
}

export default function AccountSecurityCard({ profile, className = '' }: Props) {
    const lastLogin = profile.last_login;
    const loginHistory = profile.login_history || [];
    const activeSessions = profile.active_sessions || [];

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Account Security & Governance
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Protected
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Institutional security status, access verification, and recent session audit logs.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                        Active & In Good Standing
                    </span>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
                {/* Institutional Security Policy / Self-Deactivation Guard Banner */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-3.5 text-xs leading-relaxed">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">Institutional Governance Policy: Self-Deactivation Restricted</p>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-200 text-amber-900">
                                Enforced
                            </span>
                        </div>
                        <p className="text-slate-700 mt-1">
                            In compliance with university supply and property management regulations (COA & SPMO Guidelines),
                            users <strong>cannot deactivate, suspend, lock, or delete their own accounts</strong>.
                            This restriction is enforced on the server backend to preserve asset accountability and audit ledger integrity.
                            If you require account status modifications or transfer of custody, please consult a designated System Administrator.
                        </p>
                    </div>
                </div>

                {/* Grid: Account Status Summary & Last Login */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Account Status Card */}
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Account Authentication Status
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-sm">
                                OK
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>Status:</span>
                                    <span className="text-emerald-700 uppercase font-black tracking-wider">
                                        {profile.account_status || 'Active'}
                                    </span>
                                </p>
                                <p className="text-xs text-slate-500">
                                    Role: <span className="font-semibold text-slate-700">{profile.role || 'Staff'}</span> • Single Sign-on Ready
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                            <div>
                                <span className="text-slate-400 block">Email Verified:</span>
                                <span className="font-medium text-slate-800">
                                    {profile.email_verified_at ? 'Verified' : 'Pending Verification'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Two-Factor / Role:</span>
                                <span className="font-medium text-slate-800">
                                    RBAC Authenticated
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Last Login Information Card */}
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Most Recent Login
                            </span>
                            <Clock className="w-4 h-4 text-slate-400" />
                        </div>

                        {lastLogin ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="text-xs font-bold text-slate-900">
                                        {lastLogin.timestamp}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        ({lastLogin.time_ago})
                                    </span>
                                </div>

                                <div className="text-[11px] text-slate-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="font-mono text-slate-700">{lastLogin.ip_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate">
                                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate text-slate-500">{lastLogin.user_agent}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <span>Current session logged in from this device.</span>
                            </div>
                        )}

                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                            Logins are verified and hashed in the System Audit Trail ledger.
                        </p>
                    </div>
                </div>

                {/* Active Sessions List (if present) */}
                {activeSessions.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                Active System Sessions ({activeSessions.length})
                            </h3>
                            <span className="text-[11px] text-slate-400">Database Session Driver</span>
                        </div>

                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                            {activeSessions.map((session, idx) => (
                                <div key={session.id || idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                            {session.user_agent?.toLowerCase().includes('mobile') ? (
                                                <Smartphone className="w-4 h-4" />
                                            ) : (
                                                <Laptop className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-900">{session.ip_address}</span>
                                                {session.is_current && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate max-w-md">
                                                {session.user_agent}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right text-[11px] text-slate-500 shrink-0">
                                        <span>Active {session.last_active}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Login History Trail */}
                {loginHistory.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                Recent Authentication History (Audit Logs)
                            </h3>
                            <span className="text-[11px] text-slate-400">Last 5 Authentications</span>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                                        <tr>
                                            <th className="px-4 py-2.5">Status</th>
                                            <th className="px-4 py-2.5">IP Address</th>
                                            <th className="px-4 py-2.5">Timestamp</th>
                                            <th className="px-4 py-2.5 hidden sm:table-cell">Browser Agent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {loginHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        item.status === 'Success'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            item.status === 'Success' ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}></span>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-900 font-medium">
                                                    {item.ip_address}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="font-semibold text-slate-900">{item.timestamp}</span>
                                                    <span className="text-[10px] text-slate-400 block">{item.time_ago}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500 text-[11px] truncate max-w-xs hidden sm:table-cell">
                                                    {item.user_agent}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
