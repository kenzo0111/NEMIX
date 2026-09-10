import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentActivity } from '../types';
import { History, ArrowRight } from 'lucide-react';

interface RecentSystemActivityProps {
    activities?: RecentActivity[];
}

export default function RecentSystemActivity({ activities = [] }: RecentSystemActivityProps) {
    return (
        <section aria-label="Recent System Activity" className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
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
                    <span>View Audit Logs</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {activities.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">No recent system activity recorded.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {activities.slice(0, 8).map((act, idx) => (
                        <div key={act.id ?? idx} className="py-2.5 flex items-start justify-between gap-4 group">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900 group-hover:text-red-900 transition-colors">
                                        {act.user}
                                    </span>
                                    {act.role && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                            {act.role}
                                        </span>
                                    )}
                                    {act.module && (
                                        <span className="text-[10px] font-medium text-gray-400">
                                            in {act.module}
                                        </span>
                                    )}
                                </div>

                                <div className="text-xs text-gray-800 font-medium mt-0.5">
                                    {act.action}
                                    {act.details && (
                                        <span className="text-gray-500 font-normal ml-1">
                                            — {act.details}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="text-[11px] font-medium text-gray-500 block">
                                    {act.time}
                                </span>
                                {act.timestamp && (
                                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                                        {act.timestamp}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>Investigate Detailed Audit Trails</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </section>
    );
}
