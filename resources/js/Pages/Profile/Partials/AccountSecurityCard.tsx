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
        <div className={`bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden ${className}`}>
            {/* Modern Top Header (Matches Dashboard Card Headers) */}
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-red-900 to-red-800 flex items-center justify-center text-white shadow-xs ring-4 ring-red-50 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                                Account Security & Governance
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                Protected & Audited
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Institutional governance policies, access credentials status, and live authentication ledgers
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">
                        Active & In Good Standing
                    </span>
                </div>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
                {/* Institutional Security Policy / Self-Deactivation Guard Banner (Matches Dashboard Welcome Banner) */}
                <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-400 p-5 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
                        <div className="p-2.5 rounded bg-red-900/90 border border-red-800 text-amber-300 shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/90 border border-red-800 text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    Enforced Security Rule
                                </span>
                                <span className="text-[10px] text-red-200/80 font-mono">COA & SPMO AUDIT STANDARD</span>
                            </div>
                            <h4 className="text-sm font-bold font-serif text-white tracking-tight">
                                Self-Account Deactivation & Suspension Restricted
                            </h4>
                            <p className="text-xs text-red-100/90 font-normal leading-relaxed">
                                In accordance with institutional property management regulations and asset accountability guidelines,
                                personnel <strong>cannot deactivate, suspend, lock, or delete their own accounts</strong>.
                                This restriction is enforced on the server backend to preserve custodial integrity.
                                Any role or status adjustments must be authorized by a designated System Administrator.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Status Summary & Last Login (Matches Dashboard Top Border Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Card 1: Account Status */}
                    <div className="bg-white rounded-lg p-5 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                    Authentication Status
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight font-sans mt-0.5">
                                    Operational Status: Active
                                </h3>
                            </div>
                            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Role Assignment</span>
                                <span className="font-bold text-slate-800">{profile.role}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Email Status</span>
                                <span className="font-bold text-emerald-700">
                                    {profile.email_verified_at ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Most Recent Login */}
                    <div className="bg-white rounded-lg p-5 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                    Access Ledger
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight font-sans mt-0.5">
                                    Most Recent Sign-in
                                </h3>
                            </div>
                            <div className="p-2 rounded bg-red-50 border border-gray-200 text-red-900">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>

                        {lastLogin ? (
                            <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">{lastLogin.timestamp}</span>
                                    <span className="text-[10px] font-mono text-slate-400">({lastLogin.time_ago})</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                                    <span className="flex items-center gap-1">
                                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                                        {lastLogin.ip_address}
                                    </span>
                                    <span className="truncate max-w-[200px] text-slate-400">
                                        {lastLogin.user_agent}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-gray-100 text-xs text-slate-500">
                                Current authenticated session from this device.
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Sessions List (if present) */}
                {activeSessions.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans flex items-center gap-1.5">
                                <Laptop className="w-4 h-4 text-slate-400" />
                                Active System Sessions ({activeSessions.length})
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Database Session Driver
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                            {activeSessions.map((session, idx) => (
                                <div key={session.id || idx} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-900 shrink-0">
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
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                                                {session.user_agent}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                                        Active {session.last_active}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Login History Trail (Matches Dashboard Table Style) */}
                {loginHistory.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-slate-400" />
                                Authentication Audit Trail
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Last 5 Successful Entries
                            </span>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 border border-slate-200/80 rounded-xl overflow-hidden text-xs shadow-2xs">
                                <thead className="bg-slate-50/90">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">IP Address</th>
                                        <th className="px-5 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-5 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Client Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {loginHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    item.status === 'Success'
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                                        : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        item.status === 'Success' ? 'bg-emerald-600' : 'bg-rose-600'
                                                    }`}></span>
                                                    <span>{item.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                                                {item.ip_address}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-bold text-slate-900">{item.timestamp}</span>
                                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.time_ago}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 text-[11px] truncate max-w-sm hidden sm:table-cell">
                                                {item.user_agent}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
