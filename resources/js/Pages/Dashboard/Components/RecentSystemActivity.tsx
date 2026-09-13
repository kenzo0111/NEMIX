import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentActivity } from '../types';
import { normalizeActivity } from '../utils/normalizeActivity';
import { History, ArrowRight } from 'lucide-react';

interface RecentSystemActivityProps {
    activities?: RecentActivity[];
}

export default function RecentSystemActivity({ activities = [] }: RecentSystemActivityProps) {
    // Show concise operational overview: 6 latest business events
    const normalizedActivities = (activities || [])
        .map(normalizeActivity)
        .slice(0, 6);

    return (
        <section
            aria-label="Recent System Activity"
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs w-full min-w-0"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-slate-100 text-slate-600">
                        <History className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Recent System Activity
                        </h2>
                        <p className="text-[11px] text-slate-500">
                            Latest inventory, compliance, and administrative activity.
                        </p>
                    </div>
                </div>

                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-950 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                    <span>View All Activity</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Empty State */}
            {normalizedActivities.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-1">
                    <p className="text-xs font-medium text-slate-700">No recent system activity.</p>
                    <p className="text-[11px] text-slate-400">
                        New inventory, compliance, and administrative actions will appear here.
                    </p>
                </div>
            ) : (
                /* Activity Stream with 3-Level Text-First Hierarchy */
                <div className="divide-y divide-slate-100 w-full min-w-0">
                    {normalizedActivities.map((act, idx) => {
                        const statusLower = (act.status || '').toLowerCase();
                        const isDestructiveOrFailed =
                            statusLower.includes('fail') ||
                            statusLower.includes('error') ||
                            statusLower.includes('reject');

                        // Resolve clean secondary reference string
                        const entityName = typeof act.context?.entity === 'string' ? act.context.entity : null;
                        const stockNo = typeof act.context?.stock_no === 'string' ? act.context.stock_no : null;

                        let displayReference: string | null = act.reference || null;
                        if (entityName && stockNo) {
                            displayReference = `${entityName} · ${stockNo}`;
                        } else if (entityName && act.reference && entityName !== act.reference) {
                            displayReference = `${entityName} · ${act.reference}`;
                        }

                        return (
                            <div
                                key={act.id ?? idx}
                                className="py-3.5 flex flex-col justify-between gap-1 group min-w-0 w-full"
                            >
                                {/* LINE 1: Main Activity Title + Optional Business Reference */}
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                                    <span
                                        className={`text-sm font-semibold tracking-tight ${
                                            isDestructiveOrFailed
                                                ? 'text-red-700'
                                                : 'text-slate-900 group-hover:text-slate-950'
                                        }`}
                                    >
                                        {act.title}
                                    </span>

                                    {displayReference && (
                                        <span className="text-xs text-slate-500 font-mono font-normal">
                                            · {displayReference}
                                        </span>
                                    )}
                                </div>

                                {/* LINE 2: Human-Readable Natural Summary */}
                                {act.summary && (
                                    <p className="text-sm text-slate-700 leading-relaxed break-words">
                                        {act.summary}
                                    </p>
                                )}

                                {/* LINE 3: Metadata Line (Module • Time • Actor) */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-0.5 min-w-0">
                                    <span className="font-medium text-slate-600">{act.module}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{act.time || act.timestamp || 'Recently'}</span>
                                    {act.actor?.name && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-600">{act.actor.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Footer Link */}
            <div className="pt-3 mt-1 border-t border-slate-100 flex justify-end">
                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>View All Activity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </section>
    );
}
