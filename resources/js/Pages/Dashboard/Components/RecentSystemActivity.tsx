import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentActivity } from '../types';
import { normalizeActivity } from '../utils/normalizeActivity';
import {
    History,
    ArrowRight,
    PackageMinus,
    PackagePlus,
    FileText,
    Building2,
    Settings,
    Radio,
    ShieldCheck,
} from 'lucide-react';

interface RecentSystemActivityProps {
    activities?: RecentActivity[];
}

function getActivityIcon(eventKey?: string, module?: string, title?: string) {
    const key = (eventKey || '').toLowerCase();
    const mod = (module || '').toLowerCase();
    const tit = (title || '').toLowerCase();

    if (key.includes('issuance') || tit.includes('issuance')) {
        return <PackageMinus className="w-3.5 h-3.5 text-amber-700" />;
    }
    if (key.includes('receiving') || tit.includes('receiving') || tit.includes('stock in')) {
        return <PackagePlus className="w-3.5 h-3.5 text-emerald-700" />;
    }
    if (key.includes('rpci') || key.includes('rsmi') || key.includes('report') || mod.includes('compliance')) {
        return <FileText className="w-3.5 h-3.5 text-blue-700" />;
    }
    if (key.includes('supplier') || mod.includes('supplier')) {
        return <Building2 className="w-3.5 h-3.5 text-indigo-700" />;
    }
    if (key.includes('setting') || mod.includes('admin') || tit.includes('setting')) {
        return <Settings className="w-3.5 h-3.5 text-slate-700" />;
    }
    if (key.includes('rfid') || mod.includes('rfid')) {
        return <Radio className="w-3.5 h-3.5 text-purple-700" />;
    }
    if (mod.includes('access') || tit.includes('staff') || tit.includes('role')) {
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />;
    }
    return <History className="w-3.5 h-3.5 text-gray-600" />;
}

export default function RecentSystemActivity({ activities = [] }: RecentSystemActivityProps) {
    const normalizedActivities = (activities || []).map(normalizeActivity).slice(0, 8);

    return (
        <section aria-label="Recent System Activity" className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs w-full min-w-0">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gray-100 text-gray-700">
                        <History className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Recent System Activity
                        </h2>
                        <p className="text-[11px] text-gray-500">Live feed of verified business and operational events</p>
                    </div>
                </div>

                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline inline-flex items-center gap-1"
                >
                    <span>View All Activity</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {normalizedActivities.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">No recent system activity recorded.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 w-full min-w-0">
                    {normalizedActivities.map((act, idx) => {
                        const icon = getActivityIcon(act.event_key, act.module, act.title);
                        const department = (act.context?.department as string) || null;

                        return (
                            <div key={act.id ?? idx} className="py-3 flex items-start gap-3 group min-w-0 w-full">
                                <div className="mt-0.5 p-1.5 rounded-md bg-gray-50 border border-gray-200/60 shrink-0">
                                    {icon}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                    {/* Line 1: Title and Reference */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-gray-900 group-hover:text-red-900 transition-colors">
                                            {act.title}
                                        </span>
                                        {act.reference && (
                                            <span className="inline-flex items-center text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200/80">
                                                {act.reference}
                                            </span>
                                        )}
                                    </div>

                                    {/* Line 2: Short Summary */}
                                    {act.summary && (
                                        <p className="text-xs text-gray-700 font-medium break-words leading-relaxed">
                                            {act.summary}
                                        </p>
                                    )}

                                    {/* Line 3: Department / Context */}
                                    {department && (
                                        <p className="text-[11px] text-gray-500 break-words">
                                            {department}
                                        </p>
                                    )}

                                    {/* Line 4: Module, Timestamp, and Actor */}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 pt-0.5">
                                        <span className="font-semibold text-gray-500">{act.module}</span>
                                        <span>•</span>
                                        <span>{act.time || act.timestamp}</span>
                                        {act.actor?.name && (
                                            <>
                                                <span>•</span>
                                                <span className="text-gray-500">by {act.actor.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>View All Activity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </section>
    );
}
