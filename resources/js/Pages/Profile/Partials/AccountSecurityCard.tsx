import React, { useState } from 'react';
import { UserProfileDetails } from '../types';
import PolicyNotice from '../components/PolicyNotice';
import {
    ShieldCheck,
    Laptop,
    Smartphone,
    Activity,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface Props {
    profile: UserProfileDetails;
    className?: string;
}

export default function AccountSecurityCard({ profile, className = '' }: Props) {
    const loginHistory = profile.login_history || [];
    const activeSessions = profile.active_sessions || [];

    const [isExpanded, setIsExpanded] = useState(false);
    const displayedHistory = isExpanded ? loginHistory : loginHistory.slice(0, 10);
    const hasMoreHistory = loginHistory.length > 10;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Account Management Policy Notice */}
            <PolicyNotice />

            {/* Active Browser Sessions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0">
                            <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold font-serif text-slate-900">
                                Active System Sessions
                            </h2>
                            <p className="text-xs text-slate-500">
                                Currently authenticated devices and browser sessions associated with this account
                            </p>
                        </div>
                    </div>

                    <span className="text-xs font-mono text-slate-500">
                        {activeSessions.length} {activeSessions.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                </div>

                <div className="p-6">
                    {activeSessions.length > 0 ? (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                            {activeSessions.map((session, idx) => (
                                <div
                                    key={session.id || idx}
                                    className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/70 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                            {session.user_agent?.toLowerCase().includes('mobile') ? (
                                                <Smartphone className="w-3.5 h-3.5" />
                                            ) : (
                                                <Laptop className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-slate-900">
                                                    {session.ip_address}
                                                </span>
                                                {session.is_current && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
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
                    ) : (
                        <p className="text-xs text-slate-500">
                            Active session tracking operates when the database session driver is configured.
                        </p>
                    )}
                </div>
            </div>

            {/* Authentication Audit Trail */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold font-serif text-slate-900">
                                Authentication Audit Trail
                            </h2>
                            <p className="text-xs text-slate-500">
                                Official sign-in activity recorded by the institutional security ledger
                            </p>
                        </div>
                    </div>

                    <span className="text-xs font-mono text-slate-500">
                        {loginHistory.length} {loginHistory.length === 1 ? 'Record' : 'Records'}
                    </span>
                </div>

                <div className="p-6">
                    {displayedHistory.length > 0 ? (
                        <div className="space-y-3">
                            <div className="w-full overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-200 text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Status</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-slate-700">IP Address</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Timestamp</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-slate-700 hidden sm:table-cell">Client Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {displayedHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            item.status === 'Success'
                                                                ? 'bg-emerald-50 text-emerald-800'
                                                                : 'bg-rose-50 text-rose-800'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                item.status === 'Success' ? 'bg-emerald-600' : 'bg-rose-600'
                                                            }`}
                                                        />
                                                        <span>{item.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-slate-800 whitespace-nowrap">
                                                    {item.ip_address}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span className="text-slate-900 font-medium">{item.timestamp}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono block">
                                                        {item.time_ago}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500 text-[11px] truncate max-w-xs hidden sm:table-cell">
                                                    {item.user_agent}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* View More / Less toggle */}
                            {hasMoreHistory && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded((prev) => !prev)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-900 hover:text-red-950 cursor-pointer"
                                    >
                                        <span>{isExpanded ? 'Show Fewer Records' : `View All (${loginHistory.length}) Records`}</span>
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">
                            No recent login events recorded in the audit trail.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
